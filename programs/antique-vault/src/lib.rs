use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

declare_id!("FnYhRhWkpALRFhm59FSmUeEaCRLvtQCXV2PVL5Hiz3WL");

#[program]
pub mod antique_vault {
    use super::*;

    /// One-time setup per admin wallet. Creates the vault PDA that tracks all items.
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.item_count = 0;
        vault.bump = ctx.bumps.vault;
        Ok(())
    }

    /// Called after Metaplex mints the NFT. Links the physical item to its on-chain record.
    pub fn register_item(
        ctx: Context<RegisterItem>,
        item_id: String,
        name: String,
        condition: u8,
        appraised_value_usd_cents: u64,
        category: String,
    ) -> Result<()> {
        require!(item_id.len() <= 32, VaultError::ItemIdTooLong);
        require!(name.len() <= 64, VaultError::NameTooLong);
        require!(condition <= 5, VaultError::InvalidCondition);
        require!(category.len() <= 32, VaultError::CategoryTooLong);

        let vault = &mut ctx.accounts.vault;
        let item = &mut ctx.accounts.item;

        item.vault = vault.key();
        item.item_id = item_id.clone();
        item.name = name.clone();
        item.nft_mint = ctx.accounts.nft_mint.key();
        item.condition = condition;
        item.appraised_value_usd_cents = appraised_value_usd_cents;
        item.status = ItemStatus::InVault as u8;
        item.minted_at = Clock::get()?.unix_timestamp;
        item.redeemed_at = 0;
        item.shipping_address = String::new();
        item.category = category.clone();
        item.bump = ctx.bumps.item;

        vault.item_count += 1;

        emit!(ItemRegistered {
            item_id,
            nft_mint: item.nft_mint,
            name,
            appraised_value_usd_cents,
            minted_at: item.minted_at,
        });

        Ok(())
    }

    /// NFT holder redeems the physical item. Emits an event with shipping address
    /// so the admin backend can trigger fulfillment. NFT burn handled client-side.
    pub fn redeem_item(
        ctx: Context<RedeemItem>,
        item_id: String,
        shipping_address: String,
    ) -> Result<()> {
        require!(item_id.len() <= 32, VaultError::ItemIdTooLong);
        require!(shipping_address.len() <= 200, VaultError::AddressTooLong);

        let item = &mut ctx.accounts.item;
        require!(item.status == ItemStatus::InVault as u8, VaultError::NotInVault);

        item.status = ItemStatus::Redeemed as u8;
        item.redeemed_at = Clock::get()?.unix_timestamp;
        item.shipping_address = shipping_address.clone();

        emit!(ItemRedeemed {
            item_id: item.item_id.clone(),
            nft_mint: item.nft_mint,
            redeemed_by: ctx.accounts.owner.key(),
            shipping_address,
            redeemed_at: item.redeemed_at,
        });

        Ok(())
    }
}

// ─── Accounts ────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = authority,
        space = Vault::LEN,
        seeds = [b"vault", authority.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(item_id: String)]
pub struct RegisterItem<'info> {
    #[account(
        mut,
        seeds = [b"vault", authority.key().as_ref()],
        bump = vault.bump,
        has_one = authority
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer = authority,
        space = ItemRecord::LEN,
        seeds = [b"item", vault.key().as_ref(), item_id.as_bytes()],
        bump
    )]
    pub item: Account<'info, ItemRecord>,

    pub nft_mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(item_id: String)]
pub struct RedeemItem<'info> {
    #[account(
        mut,
        seeds = [b"item", item.vault.as_ref(), item_id.as_bytes()],
        bump = item.bump
    )]
    pub item: Account<'info, ItemRecord>,

    #[account(
        constraint = nft_token_account.mint == item.nft_mint @ VaultError::WrongNft,
        constraint = nft_token_account.owner == owner.key() @ VaultError::NotNftOwner,
        constraint = nft_token_account.amount == 1 @ VaultError::NotNftOwner,
    )]
    pub nft_token_account: Account<'info, TokenAccount>,

    pub owner: Signer<'info>,
}

// ─── State ───────────────────────────────────────────────────────────────────

#[account]
pub struct Vault {
    pub authority: Pubkey, // 32
    pub item_count: u64,   // 8
    pub bump: u8,          // 1
}

impl Vault {
    pub const LEN: usize = 8 + 32 + 8 + 1; // 49
}

#[account]
pub struct ItemRecord {
    pub vault: Pubkey,                  // 32
    pub item_id: String,                // 4 + 32 = 36
    pub name: String,                   // 4 + 64 = 68
    pub nft_mint: Pubkey,               // 32
    pub condition: u8,                  // 1
    pub appraised_value_usd_cents: u64, // 8
    pub status: u8,                     // 1  (0=InVault, 1=Redeemed)
    pub minted_at: i64,                 // 8
    pub redeemed_at: i64,               // 8
    pub shipping_address: String,       // 4 + 200 = 204
    pub category: String,               // 4 + 32 = 36
    pub bump: u8,                       // 1
}

impl ItemRecord {
    pub const LEN: usize = 8 + 32 + 36 + 68 + 32 + 1 + 8 + 1 + 8 + 8 + 204 + 36 + 1; // 443
}

#[repr(u8)]
pub enum ItemStatus {
    InVault = 0,
    Redeemed = 1,
}

// ─── Events ──────────────────────────────────────────────────────────────────

#[event]
pub struct ItemRegistered {
    pub item_id: String,
    pub nft_mint: Pubkey,
    pub name: String,
    pub appraised_value_usd_cents: u64,
    pub minted_at: i64,
}

#[event]
pub struct ItemRedeemed {
    pub item_id: String,
    pub nft_mint: Pubkey,
    pub redeemed_by: Pubkey,
    pub shipping_address: String,
    pub redeemed_at: i64,
}

// ─── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum VaultError {
    #[msg("Item ID must be 32 characters or less")]
    ItemIdTooLong,
    #[msg("Name must be 64 characters or less")]
    NameTooLong,
    #[msg("Condition must be 0-5")]
    InvalidCondition,
    #[msg("Shipping address must be 200 characters or less")]
    AddressTooLong,
    #[msg("Item is not currently in the vault")]
    NotInVault,
    #[msg("You do not own this NFT")]
    NotNftOwner,
    #[msg("NFT does not match this item record")]
    WrongNft,
    #[msg("Category must be 32 characters or less")]
    CategoryTooLong,
}
