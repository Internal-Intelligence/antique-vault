import { Connection, PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { computeQuantumFeeBoostDecision, computeQuantumFee } from './quantum';

const TOKEN_PROGRAM = TOKEN_PROGRAM_ID;
const ASSOCIATED_TOKEN_PROGRAM = ASSOCIATED_TOKEN_PROGRAM_ID;
const SYSTEM_PROGRAM = SystemProgram.programId;

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
    {
      name: "createListing",
      accounts: [
        { name: "listing", isMut: true, isSigner: false },
        { name: "sellerNftAccount", isMut: true, isSigner: false },
        { name: "escrowTokenAccount", isMut: true, isSigner: false },
        { name: "nftMint", isMut: false, isSigner: false },
        { name: "seller", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false },
      ],
      args: [
        { name: "price", type: "u64" },
        { name: "listingType", type: "u8" },
        { name: "durationSeconds", type: "i64" },
        { name: "reservePrice", type: "u64" },
        { name: "isPromoted", type: "bool" },
        { name: "category", type: "string" },
        { name: "ownerFeeBps", type: "u16" },
        { name: "booster", type: "publicKey" },
        { name: "boosterShareBps", type: "u16" },
        { name: "acqRoundId", type: "u32" },
        { name: "neuroScore", type: "u8" },
      ],
    },
    {
      name: "buyListing",
      accounts: [
        { name: "listing", isMut: true, isSigner: false },
        { name: "escrowTokenAccount", isMut: true, isSigner: false },
        { name: "buyerNftAccount", isMut: true, isSigner: false },
        { name: "buyer", isMut: true, isSigner: true },
        { name: "seller", isMut: true, isSigner: false },
        { name: "feeRecipient", isMut: true, isSigner: false },
        { name: "booster", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
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
      name: "Listing",
      type: {
        kind: "struct",
        fields: [
          { name: "seller", type: "publicKey" },
          { name: "nftMint", type: "publicKey" },
          { name: "price", type: "u64" },
          { name: "listingType", type: "u8" },
          { name: "endTime", type: "i64" },
          { name: "highestBid", type: "u64" },
          { name: "highestBidder", type: "publicKey" },
          { name: "reservePrice", type: "u64" },
          { name: "isActive", type: "bool" },
          { name: "isPromoted", type: "bool" },
          { name: "category", type: "string" },
          { name: "soldAt", type: "i64" },
          { name: "buyer", type: "publicKey" },
          { name: "protectionExpiresAt", type: "i64" },
          { name: "disputeStatus", type: "u8" },
          { name: "bump", type: "u8" },
          { name: "ownerFeeBps", type: "u16" },
          { name: "booster", type: "publicKey" },
          { name: "boosterShareBps", type: "u16" },
          { name: "acqRoundId", type: "u32" },
          { name: "neuroScore", type: "u8" },
        ],
      },
    },
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

/** Read-only NFTBAY program for marketplace fetches (no wallet required). */
export function getNftBayReadProgram(connection: Connection) {
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (t: any) => t,
    signAllTransactions: async (t: any) => t,
  };
  return getNftBayProgram(dummyWallet as any, connection);
}

export interface NftBayListingRecord {
  listingPda: string;
  nftMint: string;
  seller: string;
  priceLamports: number;
  listingType: number;
  isPromoted: boolean;
  isActive: boolean;
  category: string;
  boosterShareBps: number;
  neuroScore: number;
  endTime: number;
  highestBidLamports: number;
}

export interface VaultItemBridge {
  itemId: string;
  name: string;
  condition: number;
  appraisedValueUsdCents: number;
  category: string;
  status: number;
}

export interface MarketplaceItem extends NftBayListingRecord {
  name: string;
  condition: number;
  appraisedValueUsdCents: number;
  itemId: string;
  image: string | null;
  /** True when shown from vault inventory without an on-chain NFTBAY listing. */
  isVaultOnly?: boolean;
}

/** Fetch active NFTBAY listings from chain. */
export async function fetchNftBayListings(connection: Connection): Promise<NftBayListingRecord[]> {
  const program = getNftBayReadProgram(connection);
  try {
    const all = await program.account.listing.all();
    return all
      .filter(({ account }: any) => account.isActive)
      .map(({ publicKey, account }: any) => ({
        listingPda: publicKey.toString(),
        nftMint: account.nftMint.toString(),
        seller: account.seller.toString(),
        priceLamports: account.price.toNumber(),
        listingType: account.listingType,
        isPromoted: account.isPromoted,
        isActive: account.isActive,
        category: account.category || "General",
        boosterShareBps: account.boosterShareBps,
        neuroScore: account.neuroScore,
        endTime: account.endTime.toNumber(),
        highestBidLamports: account.highestBid.toNumber(),
      }));
  } catch (e) {
    console.warn("[NFTBAY] fetchNftBayListings failed — program may be empty on this cluster", e);
    return [];
  }
}

/** Map vault itemRecords by nftMint for marketplace metadata bridge. */
export async function fetchVaultItemMap(connection: Connection): Promise<Map<string, VaultItemBridge>> {
  const map = new Map<string, VaultItemBridge>();
  try {
    const { IDL } = await import("./idl");
    const provider = new AnchorProvider(
      connection,
      { publicKey: PublicKey.default, signTransaction: async (t: any) => t, signAllTransactions: async (t: any) => t } as any,
      { commitment: "confirmed" }
    );
    const program = new Program(IDL as any, provider) as any;
    const records = await program.account.itemRecord.all();
    for (const { account } of records) {
      const mint = account.nftMint.toString();
      map.set(mint, {
        itemId: account.itemId,
        name: account.name,
        condition: account.condition,
        appraisedValueUsdCents: account.appraisedValueUsdCents.toNumber(),
        category: account.category || "General",
        status: account.status,
      });
    }
  } catch (e) {
    console.warn("[NFTBAY] fetchVaultItemMap failed", e);
  }
  return map;
}

/** Merge on-chain listings with vault metadata; fall back to unlisted vault inventory. */
export function bridgeListingsWithVault(
  listings: NftBayListingRecord[],
  vaultMap: Map<string, VaultItemBridge>
): MarketplaceItem[] {
  const listedMints = new Set(listings.map((l) => l.nftMint));

  const fromListings: MarketplaceItem[] = listings.map((l) => {
    const vault = vaultMap.get(l.nftMint);
    return {
      ...l,
      name: vault?.name || `${l.category} #${l.nftMint.slice(0, 4)}`,
      condition: vault?.condition ?? 3,
      appraisedValueUsdCents: vault?.appraisedValueUsdCents ?? Math.floor(l.priceLamports / 10000),
      itemId: vault?.itemId || l.nftMint.slice(0, 8),
      image: null,
      isVaultOnly: false,
    };
  });

  const vaultOnly: MarketplaceItem[] = [];
  vaultMap.forEach((vault, mint) => {
    if (listedMints.has(mint) || vault.status !== 0) return;
    vaultOnly.push({
      listingPda: "",
      nftMint: mint,
      seller: "",
      priceLamports: 0,
      listingType: 0,
      isPromoted: false,
      isActive: false,
      category: vault.category,
      boosterShareBps: 0,
      neuroScore: 0,
      endTime: 0,
      highestBidLamports: 0,
      name: vault.name,
      condition: vault.condition,
      appraisedValueUsdCents: vault.appraisedValueUsdCents,
      itemId: vault.itemId,
      image: null,
      isVaultOnly: true,
    });
  });

  return [...fromListings, ...vaultOnly];
}

/** Load marketplace grid: NFTBAY listings first, vault bridge for metadata + unlisted fallback. */
export async function loadMarketplaceItems(connection: Connection): Promise<MarketplaceItem[]> {
  const [listings, vaultMap] = await Promise.all([
    fetchNftBayListings(connection),
    fetchVaultItemMap(connection),
  ]);
  return bridgeListingsWithVault(listings, vaultMap);
}

/** Execute fixed-price buy via buyListing ix. Requires connected wallet. */
export async function executeBuyListing(
  wallet: WalletContextState,
  connection: Connection,
  item: MarketplaceItem
): Promise<string> {
  if (!wallet.connected || !wallet.publicKey) {
    throw new Error("Connect your wallet to buy on NFTBAY.");
  }
  if (item.isVaultOnly || !item.listingPda) {
    throw new Error("This item is vault inventory only — seller must create an NFTBAY listing first.");
  }
  if (item.listingType !== 0) {
    throw new Error("This is an auction listing — use Place bid instead of Buy now.");
  }
  if (item.seller === wallet.publicKey.toBase58()) {
    throw new Error("You cannot buy your own listing.");
  }

  const program = getNftBayProgram(wallet, connection);
  const listingPda = new PublicKey(item.listingPda);
  const nftMint = new PublicKey(item.nftMint);
  const seller = new PublicKey(item.seller);
  const listing = await program.account.listing.fetch(listingPda);
  const feeRecipient = getPlatformFeeRecipient();
  if (!feeRecipient) {
    throw new Error(
      "Set NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT to an existing devnet wallet for platform fee collection."
    );
  }
  const escrowAta = getListingEscrowAta(nftMint, listingPda);
  const buyerAta = getBuyerNftAta(nftMint, wallet.publicKey);
  const booster = new PublicKey(listing.booster);

  return buyNftBayListing(program, listingPda, escrowAta, buyerAta, seller, feeRecipient, booster);
}

export interface MailInPawnIntakeParams {
  deviceName: string;
  category: string;
  offerUsdCents: number;
  shipAddress: string;
  isWorking: boolean;
  /** Set after vault mints the mail-in device NFT to seller wallet. */
  nftMint?: string;
}

export interface MailInPawnIntakeResult {
  success: boolean;
  phase: "blocked" | "ai-offer" | "pawn-created" | "mail-in-queued";
  message: string;
  blockers: string[];
  txSignature?: string;
}

/**
 * Mail-in sell flow → on-chain pawn path.
 * Blocked until vault mints NFT; then submitAiOffer → createPawnPosition.
 */
export async function attemptMailInPawnIntake(
  wallet: WalletContextState,
  connection: Connection,
  params: MailInPawnIntakeParams
): Promise<MailInPawnIntakeResult> {
  const blockers: string[] = [];

  if (!wallet.connected || !wallet.publicKey) {
    blockers.push("Wallet not connected");
  }
  if (!params.shipAddress.trim()) {
    blockers.push("Ship-from address required before on-chain intake");
  }
  if (!params.deviceName.trim()) {
    blockers.push("Device name required");
  }
  if (!params.nftMint) {
    blockers.push(
      "NFT not minted yet — mail-in is off-chain until vault receives device and mints RWA token to your wallet"
    );
  }

  if (blockers.length > 0) {
    return {
      success: false,
      phase: "blocked",
      message: `On-chain pawn not available: ${blockers.join(" • ")}`,
      blockers,
    };
  }

  try {
    const program = getNftBayProgram(wallet, connection);
    const nftMint = new PublicKey(params.nftMint!);
    const offerLamports = Math.max(1, Math.floor(params.offerUsdCents * 1_000_000));
    const confidence = params.isWorking ? 82 : 64;

    const aiTx = await submitAiOffer(program, nftMint, offerLamports, confidence);

    const sellerAta = getSellerNftAta(nftMint, wallet.publicKey!);
    const q = getQuantumFeeRecommendation(offerLamports, false);
    const pawnTx = await createPawn(
      program,
      nftMint,
      sellerAta,
      new BN(offerLamports),
      86400 * 30,
      q.suggestedInterestBps,
      new BN(offerLamports),
      true
    );

    return {
      success: true,
      phase: "pawn-created",
      message: `On-chain pawn created. AI offer tx: ${aiTx.slice(0, 8)}… • Pawn tx: ${pawnTx.slice(0, 8)}…`,
      blockers: [],
      txSignature: pawnTx,
    };
  } catch (e: any) {
    const msg = e?.message || String(e);
    return {
      success: false,
      phase: "blocked",
      message: `On-chain pawn failed: ${msg}. Mail-in shipping sim continues — vault will mint NFT after receipt.`,
      blockers: [msg],
    };
  }
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

export async function repayPawn(
  program: any,
  pawnPda: PublicKey,
  borrowerNftAta: PublicKey,
  escrowAta: PublicKey,
  lender: PublicKey,
  feeRecipient?: PublicKey
) {
  const resolvedFeeRecipient =
    feeRecipient ?? getPlatformFeeRecipient() ?? program.provider.wallet.publicKey;
  return program.methods
    .repayLoan()
    .accounts({
      pawn: pawnPda,
      borrowerNftAccount: borrowerNftAta,
      escrowTokenAccount: escrowAta,
      borrower: program.provider.wallet.publicKey,
      lender,
      feeRecipient: resolvedFeeRecipient,
      tokenProgram: TOKEN_PROGRAM,
      systemProgram: SYSTEM_PROGRAM,
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

/** Platform wallet that receives owner fees / boost shares (must exist on-chain). */
export function getPlatformFeeRecipient(): PublicKey | null {
  const env = process.env.NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT;
  if (!env) return null;
  try {
    return new PublicKey(env);
  } catch {
    return null;
  }
}

/**
 * Normalize boost params to satisfy on-chain guards:
 * - promoted OR boosterShareBps>0 → booster must be real and != seller, bps > 0
 * - otherwise booster=default and bps=0
 */
export function normalizeListingBoostParams(
  seller: PublicKey,
  isPromoted: boolean,
  booster: PublicKey,
  boosterShareBps: number
): { isPromoted: boolean; booster: PublicKey; boosterShareBps: number } {
  const platform = getPlatformFeeRecipient();
  let promoted = isPromoted;
  let bps = boosterShareBps;
  let effectiveBooster = booster;

  const needsBoost = promoted || bps > 0;
  if (needsBoost) {
    if (bps <= 0) bps = 250;
    if (
      !effectiveBooster ||
      effectiveBooster.equals(PublicKey.default) ||
      effectiveBooster.equals(seller)
    ) {
      effectiveBooster = platform ?? PublicKey.default;
    }
    if (effectiveBooster.equals(PublicKey.default) || effectiveBooster.equals(seller)) {
      promoted = false;
      bps = 0;
      effectiveBooster = PublicKey.default;
    }
  } else {
    promoted = false;
    bps = 0;
    effectiveBooster = PublicKey.default;
  }

  return { isPromoted: promoted, booster: effectiveBooster, boosterShareBps: bps };
}

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
  const seller = program.provider.wallet.publicKey;
  const [listingPda] = getListingPda(seller, nftMint);
  const normalized = normalizeListingBoostParams(seller, isPromoted, booster, boosterShareBps);

  return program.methods
    .createListing(
      priceBN,
      listingType,
      new BN(durationSec),
      reserveBN,
      normalized.isPromoted,
      category,
      ownerFeeBps,
      normalized.booster,
      normalized.boosterShareBps,
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
      systemProgram: SYSTEM_PROGRAM,
      rent: SYSVAR_RENT_PUBKEY,
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
  winnerNftAta: PublicKey,
  escrowAta: PublicKey,
  feeRecipient: PublicKey,
  booster: PublicKey
) {
  return program.methods
    .settleAuction()
    .accounts({
      listing: listingPda,
      seller,
      winnerNftAccount: winnerNftAta,
      escrowTokenAccount: escrowAta,
      feeRecipient,
      booster,
      systemProgram: SYSTEM_PROGRAM,
      tokenProgram: TOKEN_PROGRAM,
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
  feeRecipient?: PublicKey,
  booster?: PublicKey
) {
  const listing = await program.account.listing.fetch(listingPda);
  const resolvedFeeRecipient =
    feeRecipient ?? getPlatformFeeRecipient() ?? sellerPk;
  const resolvedBooster = booster ?? new PublicKey(listing.booster);

  return program.methods
    .buyListing()
    .accounts({
      listing: listingPda,
      escrowTokenAccount: escrowAta,
      buyerNftAccount: buyerNftAta,
      buyer: program.provider.wallet.publicKey,
      seller: sellerPk,
      feeRecipient: resolvedFeeRecipient,
      booster: resolvedBooster,
      tokenProgram: TOKEN_PROGRAM,
      systemProgram: SYSTEM_PROGRAM,
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
  ownerFeeBps: number,
  booster: PublicKey,
  boosterShareBps: number
) {
  return createNftBayListing(
    program,
    nftMint,
    sellerNftAta,
    price,
    listingType,
    durationSec,
    reservePrice,
    isPromoted,
    category,
    ownerFeeBps,
    booster,
    boosterShareBps,
    0,
    80
  );
}
