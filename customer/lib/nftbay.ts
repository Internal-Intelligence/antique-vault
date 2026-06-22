import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { computeQuantumFeeBoostDecision, computeQuantumFee } from './quantum';

const TOKEN_PROGRAM = TOKEN_PROGRAM_ID;
const ASSOCIATED_TOKEN_PROGRAM = ASSOCIATED_TOKEN_PROGRAM_ID;

// NFTBAY program ID (from keypair)
export const NFTBAY_PROGRAM_ID = new PublicKey(
  "CCDmCxhQZCeGNP6NdB6vhAKdUECbTUtq4RK4C9zHKnYw"
);

// Minimal IDL for NFTBAY (pawn + listings). Full generated after `anchor build`
export const NFTBAY_IDL = {
  address: NFTBAY_PROGRAM_ID.toBase58(),
  version: "0.1.0",
  name: "nftbay",
  instructions: [
    // Existing (abbrev)
    { name: "createListing", args: [{ name: "price", type: "u64" }, { name: "listingType", type: "u8" }, { name: "durationSeconds", type: "i64" }, { name: "reservePrice", type: "u64" }, { name: "isPromoted", type: "bool" }, { name: "category", type: "string" }, { name: "ownerFeeBps", type: "u16" }, { name: "booster", type: "publicKey" }, { name: "boosterShareBps", type: "u16" }, { name: "acqRoundId", type: "u32" }, { name: "neuroScore", type: "u8" }] },
    { name: "buyListing", args: [] },
    // Pawn / AI quantum features
    {
      name: "createPawnPosition",
      accounts: [
        { name: "pawn", isMut: true, isSigner: false },
        { name: "borrowerNftAccount", isMut: true, isSigner: false },
        { name: "escrowTokenAccount", isMut: true, isSigner: false },
        { name: "nftMint", isMut: false, isSigner: false },
        { name: "borrower", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false },
      ],
      args: [
        { name: "requestedPawnAmount", type: "u64" },
        { name: "durationSeconds", type: "i64" },
        { name: "interestBps", type: "u16" },
        { name: "aiPawnAmount", type: "u64" },
        { name: "isRwa", type: "bool" },
      ],
    },
    {
      name: "fundPawn",
      accounts: [
        { name: "pawn", isMut: true, isSigner: false },
        { name: "lender", isMut: true, isSigner: true },
        { name: "borrower", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "repayLoan",
      accounts: [
        { name: "pawn", isMut: true, isSigner: false },
        { name: "borrowerNftAccount", isMut: true, isSigner: false },
        { name: "escrowTokenAccount", isMut: true, isSigner: false },
        { name: "borrower", isMut: true, isSigner: true },
        { name: "lender", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "liquidatePawn",
      accounts: [
        { name: "pawn", isMut: true, isSigner: false },
        { name: "escrowTokenAccount", isMut: true, isSigner: false },
        { name: "lenderNftAccount", isMut: true, isSigner: false },
        { name: "lender", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "submitAiPawnOffer",
      accounts: [
        { name: "aiOffer", isMut: true, isSigner: false },
        { name: "nftMint", isMut: false, isSigner: false },
        { name: "submitter", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "suggestedAmount", type: "u64" },
        { name: "confidence", type: "u8" },
      ],
    },
    {
      name: "updatePredictiveScore",
      accounts: [
        { name: "pawn", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "newScore", type: "u8" }],
    },
    {
      name: "resolveRwaPhysicalClaim",
      accounts: [
        { name: "pawn", isMut: true, isSigner: false },
        { name: "lender", isMut: true, isSigner: true },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "PawnPosition",
      type: {
        kind: "struct",
        fields: [
          { name: "borrower", type: "publicKey" },
          { name: "nftMint", type: "publicKey" },
          { name: "lender", type: "publicKey" },
          { name: "pawnAmount", type: "u64" },
          { name: "interestBps", type: "u16" },
          { name: "dueTimestamp", type: "i64" },
          { name: "isActive", type: "bool" },
          { name: "isRepaid", type: "bool" },
          { name: "aiPawnAmount", type: "u64" },
          { name: "predictiveScore", type: "u8" },
          { name: "isRwa", type: "bool" },
          { name: "physicalClaimStatus", type: "u8" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "AiPawnOffer",
      type: {
        kind: "struct",
        fields: [
          { name: "nftMint", type: "publicKey" },
          { name: "suggestedAmount", type: "u64" },
          { name: "confidence", type: "u8" },
          { name: "modelVersion", type: "u8" },
          { name: "updatedAt", type: "i64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "InvalidPrice", msg: "Invalid price" },
    { code: 6018, name: "InvalidAiOffer", msg: "Invalid AI offer amount" },
  ],
} as const;

export function getNftBayProgram(wallet: WalletContextState, connection: Connection) {
  const provider = new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
  return new Program(NFTBAY_IDL as any, provider) as any;
}

// Optimized PDA helpers (quantum fast)
export function getPawnPda(nftMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pawn"), nftMint.toBuffer()],
    NFTBAY_PROGRAM_ID
  );
}

export function getAiOfferPda(nftMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("ai_offer"), nftMint.toBuffer()],
    NFTBAY_PROGRAM_ID
  );
}

// Helper: call from frontend after AI computes pawn offer amount
export async function submitAiOffer(
  program: any,
  nftMint: PublicKey,
  suggestedAmountLamports: number | BN,
  confidence: number
) {
  const [aiOfferPda] = getAiOfferPda(nftMint);
  const amount = typeof suggestedAmountLamports === "number" ? new BN(suggestedAmountLamports) : suggestedAmountLamports;
  return program.methods
    .submitAiPawnOffer(amount, confidence)
    .accounts({
      aiOffer: aiOfferPda,
      nftMint,
      submitter: program.provider.wallet.publicKey,
      systemProgram: PublicKey.default, // will be filled by anchor
    })
    .rpc();
}

// ═══════════════════════════════════════════════════════════════════════════
// QUANTUM INTELLIGENCE FEE MATH (Quantum Researcher integration)
// Uses neural-spike + superposition model for dynamic fee_bps / boost / x%
// Maximizes golden loop. Anti-gaming via spike trains. Replaces pure static tiers.
// ═══════════════════════════════════════════════════════════════════════════

export function getQuantumFeeRecommendation(
  priceLamports: number,
  isPromotedHint = false,
  volumeHint = 1800,
  repHint = 0.68
) {
  const decision = computeQuantumFeeBoostDecision(priceLamports, volumeHint, repHint, 'nftbay-listing');
  const res = computeQuantumFee(priceLamports, isPromotedHint, decision);
  return {
    ...res,
    decision,
    // Also surface for pawn interestBps decision (golden loop)
    suggestedInterestBps: Math.max(80, Math.min(1450, Math.floor(380 + (decision.optimal.xPct * -1800) + (decision.spikeTrain.antiGamingScore < 0.7 ? 260 : 0)))),
  };
}

// Legacy compatible wrapper that injects quantum intelligence into fee calc
export function computeIntelligentPlatformFee(price: number, isPromoted: boolean): { fee: number; feeBps: number; proceeds: number; quantumNote: string; boost: boolean } {
  const q = getQuantumFeeRecommendation(price, isPromoted);
  return {
    fee: q.fee,
    feeBps: q.feeBps,
    proceeds: q.sellerProceeds,
    quantumNote: q.quantumNote,
    boost: q.boostApplied,
  };
}

// Create pawn using AI amount from frontend AI
export async function createPawn(
  program: any,
  nftMint: PublicKey,
  borrowerNftAta: PublicKey,
  requestedAmount: BN,
  durationSec: number,
  interestBps: number,
  aiAmount: BN,
  isRwa: boolean
) {
  const [pawnPda] = getPawnPda(nftMint);
  return program.methods
    .createPawnPosition(requestedAmount, new BN(durationSec), interestBps, aiAmount, isRwa)
    .accounts({
      pawn: pawnPda,
      borrowerNftAccount: borrowerNftAta,
      escrowTokenAccount: null, // let anchor derive ATA
      nftMint,
      borrower: program.provider.wallet.publicKey,
      tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      associatedTokenProgram: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
      systemProgram: PublicKey.default,
      rent: PublicKey.default,
    })
    .rpc();
}

export async function fundPawn(program: any, pawnPda: PublicKey, borrower: PublicKey) {
  return program.methods
    .fundPawn()
    .accounts({ pawn: pawnPda, lender: program.provider.wallet.publicKey, borrower, systemProgram: PublicKey.default })
    .rpc();
}

export async function repayPawn(program: any, pawnPda: PublicKey, borrowerNftAta: PublicKey, escrowAta: PublicKey, lender: PublicKey) {
  return program.methods
    .repayLoan()
    .accounts({
      pawn: pawnPda,
      borrowerNftAccount: borrowerNftAta,
      escrowTokenAccount: escrowAta,
      borrower: program.provider.wallet.publicKey,
      lender,
      tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      systemProgram: PublicKey.default,
    })
    .rpc();
}

// Fetch all pawns (client side filter for speed, onchain accounts small)
export async function fetchAllPawns(program: any) {
  return program.account.pawnPosition.all();
}

export async function fetchAiOffer(program: any, nftMint: PublicKey) {
  const [pda] = getAiOfferPda(nftMint);
  try {
    return await program.account.aiPawnOffer.fetch(pda);
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GOLDEN MONEY TICKET LOOP: createListing helper (Business Shark + Neurochip)
// Uses quantum/neurochip decision for dynamic x% (boosterShareBps) + owner my_fee
// Ties acq_round_id for flywheel tracking + neuro_score for predictive volume opt
// Loophole resistant: client must pass real booster != seller; onchain enforces
// ═══════════════════════════════════════════════════════════════════════════
export async function createNftBayListing(
  program: any,
  nftMint: PublicKey,
  sellerNftAta: PublicKey,
  price: BN | number,
  listingType: number, // 0 fixed, 1 auction
  durationSec: number,
  reservePrice: BN | number,
  isPromoted: boolean,
  category: string,
  ownerFeeBps: number,           // "my fee" platform cut
  booster: PublicKey,            // promoter receiving x%
  boosterShareBps: number,       // x% optimized by neurochip
  acqRoundId: number = 0,        // link to acquisition flywheel round
  neuroScore: number = 75        // from neurochip model (0-100)
) {
  const priceBN = typeof price === "number" ? new BN(price) : price;
  const reserveBN = typeof reservePrice === "number" ? new BN(reservePrice) : reservePrice;
  const boosterPk = booster || PublicKey.default;
  const seller = program.provider.wallet.publicKey;
  const [listingPda] = getListingPda(seller, nftMint);

  return program.methods
    .createListing(
      priceBN,
      listingType,
      new BN(durationSec),
      reserveBN,
      isPromoted,
      category,
      ownerFeeBps,
      boosterPk,
      boosterShareBps,
      acqRoundId,
      neuroScore
    )
    .accounts({
      listing: listingPda,
      sellerNftAccount: sellerNftAta,
      escrowTokenAccount: getListingEscrowAta(nftMint, listingPda),
      nftMint,
      seller,
      tokenProgram: TOKEN_PROGRAM,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM,
      systemProgram: PublicKey.default,
      rent: PublicKey.default,
    })
    .rpc();
}

export function getListingPda(seller: PublicKey, nftMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("listing"), seller.toBuffer(), nftMint.toBuffer()],
    NFTBAY_PROGRAM_ID
  );
}

/** Seller's ATA for an NFT mint — required for createListing. */
export function getSellerNftAta(nftMint: PublicKey, seller: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(nftMint, seller);
}

/** Buyer's ATA for receiving an NFT on purchase. */
export function getBuyerNftAta(nftMint: PublicKey, buyer: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(nftMint, buyer);
}

/** Escrow ATA owned by the listing PDA. */
export function getListingEscrowAta(nftMint: PublicKey, listingPda: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(nftMint, listingPda, true);
}

// ═══════════════════════════════════════════════════════════════════════════
// AUCTIONS: bidding + settle helpers. Wire to market/auctions UI.
// ═══════════════════════════════════════════════════════════════════════════
export async function placeAuctionBid(
  program: any,
  listingPda: PublicKey,
  bidder: PublicKey,
  bidAmount: BN,
  prevBidder?: PublicKey
) {
  // QUANTUM SPEED parallel: simple ix
  return program.methods
    .placeBid(bidAmount)
    .accounts({
      listing: listingPda,
      bidder,
      prevBidder: prevBidder || PublicKey.default,
      systemProgram: PublicKey.default,
    })
    .rpc();
}

export async function settleAuction(
  program: any,
  listingPda: PublicKey,
  seller: PublicKey,
  buyerNftAta: PublicKey, // for release
  escrowAta: PublicKey,
  feeRecipient: PublicKey,
  booster: PublicKey
) {
  return program.methods
    .settleAuction() // assume ix exists for settle
    .accounts({
      listing: listingPda,
      seller,
      buyerNftAccount: buyerNftAta,
      escrowTokenAccount: escrowAta,
      feeRecipient,
      booster,
      systemProgram: PublicKey.default,
      tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    })
    .rpc();
}

// Owner treasury PDA for fee collection (Helper 2)
export function getOwnerTreasuryPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("owner-treasury")],
    NFTBAY_PROGRAM_ID
  );
}

export async function buyNftBayListing(
  program: any,
  listingPda: PublicKey,
  escrowAta: PublicKey,
  buyerNftAta: PublicKey,
  sellerPk: PublicKey,
  feeRecipient: PublicKey, // owner treasury receiver (or PDA)
  booster: PublicKey
) {
  return program.methods
    .buyListing()
    .accounts({
      listing: listingPda,
      escrowTokenAccount: escrowAta,
      buyerNftAccount: buyerNftAta,
      buyer: program.provider.wallet.publicKey,
      seller: sellerPk,
      feeRecipient,
      booster,
      tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      systemProgram: PublicKey.default,
    })
    .rpc();
}
export async function createNftBayListingWithBoost(
  program: any,
  nftMint: PublicKey,
  sellerNftAta: PublicKey,
  price: BN,
  listingType: number,
  durationSec: number,
  reservePrice: BN,
  isPromoted: boolean,
  category: string,
  ownerFeeBps: number, // my fee bps for treasury
  booster: PublicKey, // e.g. treasury or specific promoter for golden loop
  boosterShareBps: number // x% of sold goes here on boost
) {
  const [listingPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("listing"), program.provider.wallet.publicKey.toBuffer(), nftMint.toBuffer()],
    NFTBAY_PROGRAM_ID
  );
  return program.methods
    .createListing(price, listingType, new BN(durationSec), reservePrice, isPromoted, category, ownerFeeBps, booster, boosterShareBps, 0, 80)
    .accounts({
      listing: listingPda,
      sellerNftAccount: sellerNftAta,
      escrowTokenAccount: null,
      nftMint,
      seller: program.provider.wallet.publicKey,
      tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      associatedTokenProgram: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
      systemProgram: PublicKey.default,
      rent: PublicKey.default,
    })
    .rpc();
}
