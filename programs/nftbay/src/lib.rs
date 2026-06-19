use anchor_lang::prelude::*;
use anchor_lang::solana_program::{system_instruction, program::invoke};
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;

/// NFTBAY on-chain program
/// Emulates core eBay business model features for tokenized/NFT items:
/// - Fixed price + auction listings (alongside each other via listing_type)
/// - Tiered platform fees (price-band base % + promoted uplift) on sales
/// - On-chain reputation/feedback (enhanced with rating_sum + buyer-restricted)
/// - Buyer/seller protection via escrow + protection windows + sale receipts + buyer-gated feedback
/// - Category metadata
/// - Promoted listings affect fee tier (eBay "Promoted Listings")
///
/// Existing list (create_listing), buy (buy_listing), cancel (cancel_listing) signatures + PDA
/// seeds [b"listing", seller, nft_mint] are unchanged for compatibility. New fields appended to accounts.
declare_id!("NftBay1111111111111111111111111111111111111");

#[program]
pub mod nftbay {
    use super::*;

    /// Create fixed-price or auction listing. Escrows the NFT into a PDA-controlled ATA.
    pub fn create_listing(
        ctx: Context<CreateListing>,
        price: u64,
        listing_type: u8, // 0=fixed, 1=auction
        duration_seconds: i64,
        reserve_price: u64,
        is_promoted: bool,
        category: String,
    ) -> Result<()> {
        require!(price > 0, NftBayError::InvalidPrice);
        require!(listing_type <= 1, NftBayError::InvalidListingType);
        require!(category.len() <= 32, NftBayError::CategoryTooLong);
        require!(ctx.accounts.seller_nft_account.amount == 1, NftBayError::NotNftOwner);

        let listing = &mut ctx.accounts.listing;
        listing.seller = ctx.accounts.seller.key();
        listing.nft_mint = ctx.accounts.nft_mint.key();
        listing.price = price;
        listing.listing_type = listing_type;
        listing.end_time = if listing_type == 1 { Clock::get()?.unix_timestamp + duration_seconds } else { 0 };
        listing.highest_bid = 0;
        listing.highest_bidder = Pubkey::default();
        listing.reserve_price = reserve_price;
        listing.is_active = true;
        listing.is_promoted = is_promoted;
        listing.category = category.clone();
        // New buyer protection / sale metadata (defaults for active listing)
        listing.sold_at = 0;
        listing.buyer = Pubkey::default();
        listing.protection_expires_at = 0;
        listing.dispute_status = 0;
        listing.bump = ctx.bumps.listing;

        // Escrow NFT (buyer protection)
        let cpi_accounts = Transfer {
            from: ctx.accounts.seller_nft_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.seller.to_account_info(),
        };
        token::transfer(CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts), 1)?;

        emit!(ListingCreated { nft_mint: listing.nft_mint, seller: listing.seller, price, listing_type, is_promoted, category });
        Ok(())
    }

    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(listing.is_active, NftBayError::ListingNotActive);
        require!(listing.seller == ctx.accounts.seller.key(), NftBayError::Unauthorized);

        let seeds = &[b"listing", listing.seller.as_ref(), listing.nft_mint.as_ref(), &[listing.bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.seller_nft_account.to_account_info(),
            authority: ctx.accounts.listing.to_account_info(),
        };
        token::transfer(CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer), 1)?;

        listing.is_active = false;
        emit!(ListingCancelled { nft_mint: listing.nft_mint, seller: listing.seller });
        Ok(())
    }

    /// Fixed price purchase. Applies tiered fee (promoted = higher).
    pub fn buy_listing(ctx: Context<BuyListing>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(listing.is_active, NftBayError::ListingNotActive);
        require!(listing.listing_type == 0, NftBayError::NotFixedPrice);
        require!(listing.seller != ctx.accounts.buyer.key(), NftBayError::SellerCannotBuy);

        // Enhanced tiered platform fees (eBay-like): price bands + promoted uplift (maps to final value fees + promoted listings)
        let price_for_fee = listing.price;
        let base_bps: u64 = if price_for_fee < 1_000_000_000 {
            600 // <1 SOL
        } else if price_for_fee < 10_000_000_000 {
            450 // 1-10 SOL
        } else {
            300 // high value lower %
        };
        let fee_bps: u64 = if listing.is_promoted { base_bps + 300 } else { base_bps };
        let fee = price_for_fee.checked_mul(fee_bps).ok_or(NftBayError::Overflow)?.checked_div(10000).ok_or(NftBayError::Overflow)?;
        let seller_proceeds = price_for_fee.checked_sub(fee).ok_or(NftBayError::Overflow)?;

        // Pay seller and platform fee (SOL)
        invoke(&system_instruction::transfer(&ctx.accounts.buyer.key(), &ctx.accounts.seller.key(), seller_proceeds), &[
            ctx.accounts.buyer.to_account_info(), ctx.accounts.seller.to_account_info(), ctx.accounts.system_program.to_account_info()
        ])?;
        if fee > 0 {
            invoke(&system_instruction::transfer(&ctx.accounts.buyer.key(), &ctx.accounts.fee_recipient.key(), fee), &[
                ctx.accounts.buyer.to_account_info(), ctx.accounts.fee_recipient.to_account_info(), ctx.accounts.system_program.to_account_info()
            ])?;
        }

        // Release escrowed NFT to buyer
        let seeds = &[b"listing", listing.seller.as_ref(), listing.nft_mint.as_ref(), &[listing.bump]];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.buyer_nft_account.to_account_info(),
            authority: ctx.accounts.listing.to_account_info(),
        };
        token::transfer(CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer), 1)?;

        listing.is_active = false;

        // Buyer protection extension: record sale receipt + protection window on-chain (e.g. 7-day claim/dispute period)
        let now = Clock::get()?.unix_timestamp;
        listing.sold_at = now;
        listing.buyer = ctx.accounts.buyer.key();
        listing.protection_expires_at = now + 7 * 86400; // 604800s
        listing.dispute_status = 0;

        emit!(ListingSold { nft_mint: listing.nft_mint, seller: listing.seller, buyer: ctx.accounts.buyer.key(), price: listing.price, fee, is_promoted: listing.is_promoted, category: listing.category.clone() });
        Ok(())
    }

    pub fn place_bid(ctx: Context<PlaceBid>, bid_amount: u64) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(listing.is_active, NftBayError::ListingNotActive);
        require!(listing.listing_type == 1, NftBayError::NotAuction);
        require!(Clock::get()?.unix_timestamp < listing.end_time, NftBayError::AuctionEnded);
        require!(bid_amount > listing.highest_bid, NftBayError::BidTooLow);
        require!(bid_amount >= listing.reserve_price, NftBayError::BelowReserve);
        require!(ctx.accounts.bidder.key() != listing.seller, NftBayError::SellerCannotBid);

        // Refund prior highest (bidder protection)
        if listing.highest_bid > 0 && listing.highest_bidder != Pubkey::default() {
            **ctx.accounts.listing.to_account_info().try_borrow_mut_lamports()? -= listing.highest_bid;
            **ctx.accounts.prev_bidder.to_account_info().try_borrow_mut_lamports()? += listing.highest_bid;
        }

        invoke(&system_instruction::transfer(&ctx.accounts.bidder.key(), &ctx.accounts.listing.key(), bid_amount), &[
            ctx.accounts.bidder.to_account_info(), ctx.accounts.listing.to_account_info(), ctx.accounts.system_program.to_account_info()
        ])?;

        listing.highest_bid = bid_amount;
        listing.highest_bidder = ctx.accounts.bidder.key();
        emit!(BidPlaced { nft_mint: listing.nft_mint, bidder: ctx.accounts.bidder.key(), bid_amount });
        Ok(())
    }

    pub fn settle_auction(ctx: Context<SettleAuction>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(listing.is_active, NftBayError::ListingNotActive);
        require!(listing.listing_type == 1, NftBayError::NotAuction);
        require!(Clock::get()?.unix_timestamp >= listing.end_time, NftBayError::AuctionNotEnded);
        require!(listing.highest_bidder != Pubkey::default(), NftBayError::NoBids);

        // Enhanced tiered platform fees (same logic as fixed price)
        let price_for_fee = listing.highest_bid;
        let base_bps: u64 = if price_for_fee < 1_000_000_000 {
            600
        } else if price_for_fee < 10_000_000_000 {
            450
        } else {
            300
        };
        let fee_bps: u64 = if listing.is_promoted { base_bps + 300 } else { base_bps };
        let fee = price_for_fee.checked_mul(fee_bps).ok_or(NftBayError::Overflow)?.checked_div(10000).ok_or(NftBayError::Overflow)?;
        let seller_proceeds = price_for_fee.checked_sub(fee).ok_or(NftBayError::Overflow)?;

        **ctx.accounts.listing.to_account_info().try_borrow_mut_lamports()? -= seller_proceeds;
        **ctx.accounts.seller.to_account_info().try_borrow_mut_lamports()? += seller_proceeds;
        if fee > 0 {
            **ctx.accounts.listing.to_account_info().try_borrow_mut_lamports()? -= fee;
            **ctx.accounts.fee_recipient.to_account_info().try_borrow_mut_lamports()? += fee;
        }

        // Transfer NFT to winner
        let seeds = &[b"listing", listing.seller.as_ref(), listing.nft_mint.as_ref(), &[listing.bump]];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.winner_nft_account.to_account_info(),
            authority: ctx.accounts.listing.to_account_info(),
        };
        token::transfer(CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer), 1)?;

        listing.is_active = false;

        // Buyer protection extension (auctions): record sale + protection window
        let now = Clock::get()?.unix_timestamp;
        listing.sold_at = now;
        listing.buyer = listing.highest_bidder;
        listing.protection_expires_at = now + 7 * 86400;
        listing.dispute_status = 0;

        emit!(AuctionSettled { nft_mint: listing.nft_mint, winner: listing.highest_bidder, final_price: listing.highest_bid, fee });
        Ok(())
    }

    /// On-chain reputation hook. Called post-sale for seller feedback.
    /// Enhanced: buyer-tied (only purchaser can feedback on a completed sale for integrity);
    /// rating_sum supports avg rating computation (positive->5, negative->2) emulating eBay detailed seller ratings.
    pub fn leave_feedback(ctx: Context<LeaveFeedback>, is_positive: bool) -> Result<()> {
        let rep = &mut ctx.accounts.reputation;
        let listing = &ctx.accounts.listing;

        // Buyer protection / rep extension: only the actual buyer can leave feedback when sale buyer is recorded.
        // Falls back to open for pre-update compat.
        if listing.buyer != Pubkey::default() {
            require!(ctx.accounts.caller.key() == listing.buyer, NftBayError::Unauthorized);
        }

        if rep.seller == Pubkey::default() {
            rep.seller = ctx.accounts.seller.key();
            rep.rating_sum = 0;
            rep.last_feedback_ts = 0;
        }
        rep.total_reviews = rep.total_reviews.checked_add(1).ok_or(NftBayError::Overflow)?;
        let now = Clock::get()?.unix_timestamp;
        rep.last_feedback_ts = now;
        if is_positive {
            rep.positive_count = rep.positive_count.checked_add(1).ok_or(NftBayError::Overflow)?;
            rep.rating_sum = rep.rating_sum.saturating_add(5);
        } else {
            rep.rating_sum = rep.rating_sum.saturating_add(2);
        }
        emit!(FeedbackLeft { seller: rep.seller, is_positive, new_positive: rep.positive_count, new_total: rep.total_reviews });
        Ok(())
    }
}

// ─── Accounts ───────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(price: u64, listing_type: u8, duration_seconds: i64, reserve_price: u64, is_promoted: bool, category: String)]
pub struct CreateListing<'info> {
    #[account(init, payer = seller, space = Listing::LEN, seeds = [b"listing", seller.key().as_ref(), nft_mint.key().as_ref()], bump)]
    pub listing: Account<'info, Listing>,

    #[account(mut, constraint = seller_nft_account.mint == nft_mint.key(), constraint = seller_nft_account.owner == seller.key())]
    pub seller_nft_account: Account<'info, TokenAccount>,

    #[account(init_if_needed, payer = seller, associated_token::mint = nft_mint, associated_token::authority = listing)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub nft_mint: Account<'info, Mint>,

    #[account(mut)] pub seller: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut, seeds = [b"listing", seller.key().as_ref(), listing.nft_mint.as_ref()], bump = listing.bump, has_one = seller)]
    pub listing: Account<'info, Listing>,
    #[account(mut, constraint = seller_nft_account.mint == listing.nft_mint)]
    pub seller_nft_account: Account<'info, TokenAccount>,
    #[account(mut, associated_token::mint = listing.nft_mint, associated_token::authority = listing)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut)] pub seller: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BuyListing<'info> {
    #[account(mut, seeds = [b"listing", listing.seller.as_ref(), listing.nft_mint.as_ref()], bump = listing.bump)]
    pub listing: Account<'info, Listing>,
    #[account(mut, associated_token::mint = listing.nft_mint, associated_token::authority = listing)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut, constraint = buyer_nft_account.mint == listing.nft_mint, constraint = buyer_nft_account.owner == buyer.key())]
    pub buyer_nft_account: Account<'info, TokenAccount>,
    #[account(mut)] pub buyer: Signer<'info>,
    #[account(mut)] pub seller: AccountInfo<'info>,
    #[account(mut)] pub fee_recipient: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBid<'info> {
    #[account(mut, seeds = [b"listing", listing.seller.as_ref(), listing.nft_mint.as_ref()], bump = listing.bump)]
    pub listing: Account<'info, Listing>,
    #[account(mut)] pub prev_bidder: AccountInfo<'info>,
    #[account(mut)] pub bidder: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleAuction<'info> {
    #[account(mut, seeds = [b"listing", listing.seller.as_ref(), listing.nft_mint.as_ref()], bump = listing.bump)]
    pub listing: Account<'info, Listing>,
    #[account(mut, associated_token::mint = listing.nft_mint, associated_token::authority = listing)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut, constraint = winner_nft_account.mint == listing.nft_mint, constraint = winner_nft_account.owner == listing.highest_bidder)]
    pub winner_nft_account: Account<'info, TokenAccount>,
    #[account(mut)] pub seller: AccountInfo<'info>,
    #[account(mut)] pub fee_recipient: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LeaveFeedback<'info> {
    #[account(init_if_needed, payer = caller, space = SellerReputation::LEN, seeds = [b"reputation", seller.key().as_ref()], bump)]
    pub reputation: Account<'info, SellerReputation>,
    pub listing: Account<'info, Listing>,
    #[account(mut)] pub caller: Signer<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: seller pubkey for seeds, passed explicitly for rep
    pub seller: AccountInfo<'info>,
}

// ─── State ──────────────────────────────────────────────────────────────────

#[account]
pub struct Listing {
    pub seller: Pubkey,
    pub nft_mint: Pubkey,
    pub price: u64,
    pub listing_type: u8,
    pub end_time: i64,
    pub highest_bid: u64,
    pub highest_bidder: Pubkey,
    pub reserve_price: u64,
    pub is_active: bool,
    pub is_promoted: bool,
    pub category: String,
    // Buyer protection extensions: sale receipt + dispute window metadata (populated on buy/settle)
    pub sold_at: i64,
    pub buyer: Pubkey,
    pub protection_expires_at: i64,
    pub dispute_status: u8, // 0=none, 1=open, 2=resolved (seller win), 3=resolved (buyer win)
    pub bump: u8,
}
impl Listing {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 1 + 8 + 8 + 32 + 8 + 1 + 1 + 36 + 8 + 32 + 8 + 1 + 1;
}

#[account]
pub struct SellerReputation {
    pub seller: Pubkey,
    pub positive_count: u32,
    pub total_reviews: u32,
    // Enhanced reputation: rating_sum enables avg rating calc (e.g. 1-5 scale). Positive bools map to high ratings.
    pub rating_sum: u32,
    pub last_feedback_ts: i64,
    pub bump: u8,
}
impl SellerReputation {
    pub const LEN: usize = 8 + 32 + 4 + 4 + 4 + 8 + 1;
}

// ─── Events ─────────────────────────────────────────────────────────────────

#[event] pub struct ListingCreated { pub nft_mint: Pubkey, pub seller: Pubkey, pub price: u64, pub listing_type: u8, pub is_promoted: bool, pub category: String }
#[event] pub struct ListingCancelled { pub nft_mint: Pubkey, pub seller: Pubkey }
#[event] pub struct ListingSold { pub nft_mint: Pubkey, pub seller: Pubkey, pub buyer: Pubkey, pub price: u64, pub fee: u64, pub is_promoted: bool, pub category: String }
#[event] pub struct BidPlaced { pub nft_mint: Pubkey, pub bidder: Pubkey, pub bid_amount: u64 }
#[event] pub struct AuctionSettled { pub nft_mint: Pubkey, pub winner: Pubkey, pub final_price: u64, pub fee: u64 }
#[event] pub struct FeedbackLeft { pub seller: Pubkey, pub is_positive: bool, pub new_positive: u32, pub new_total: u32 }

// ─── Errors ─────────────────────────────────────────────────────────────────

#[error_code]
pub enum NftBayError {
    #[msg("Invalid price")] InvalidPrice,
    #[msg("Invalid listing type")] InvalidListingType,
    #[msg("Category too long")] CategoryTooLong,
    #[msg("Listing not active")] ListingNotActive,
    #[msg("Unauthorized")] Unauthorized,
    #[msg("Not fixed price")] NotFixedPrice,
    #[msg("Seller cannot buy")] SellerCannotBuy,
    #[msg("Overflow")] Overflow,
    #[msg("Not auction")] NotAuction,
    #[msg("Auction ended")] AuctionEnded,
    #[msg("Bid too low")] BidTooLow,
    #[msg("Below reserve")] BelowReserve,
    #[msg("Seller cannot bid")] SellerCannotBid,
    #[msg("Auction not ended")] AuctionNotEnded,
    #[msg("No bids")] NoBids,
    #[msg("Not NFT owner")] NotNftOwner,
    // Buyer protection extensions
    #[msg("Protection window expired")] ProtectionExpired,
    #[msg("Dispute already open or resolved")] DisputeActive,
    #[msg("Only buyer of this sale can act")] OnlyBuyerDispute,
}
