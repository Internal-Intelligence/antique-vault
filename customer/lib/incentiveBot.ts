import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  computeMinNextBidLamports,
  getNftBayProgram,
  getNftBayReadProgram,
  placeAuctionBid,
  type MarketplaceItem,
  type NftBayListingRecord,
} from "./nftbay";
import { INCENTIVE_CATEGORIES } from "./mission";

/** Platform incentive bidder — funded by marketplace fee treasury. */
export function getIncentiveBotPubkey(): PublicKey | null {
  const raw = process.env.NEXT_PUBLIC_INCENTIVE_BOT_PUBKEY?.trim();
  if (!raw) return null;
  try {
    return new PublicKey(raw);
  } catch {
    return null;
  }
}

export function isIncentiveBidder(pubkey?: string | null): boolean {
  if (!pubkey) return false;
  const bot = getIncentiveBotPubkey();
  return bot ? bot.toString() === pubkey : false;
}

export function matchesIncentiveCategory(category: string, name: string): boolean {
  const hay = `${category} ${name}`.toLowerCase();
  return INCENTIVE_CATEGORIES.some((tag) => hay.includes(tag));
}

/** Score auctions for incentive liquidity — higher = more deserving of a platform bid. */
export function scoreIncentiveTarget(item: MarketplaceItem | NftBayListingRecord): number {
  if (item.listingType !== 1 || !item.isActive) return 0;

  let score = 0;
  const name = "name" in item ? item.name : "";
  if (matchesIncentiveCategory(item.category, name)) score += 30;
  if (item.isPromoted) score += 20;
  if (item.neuroScore >= 70) score += 15;
  if (item.highestBidLamports > 0) score += 10;
  if (item.reservePriceLamports && item.highestBidLamports >= item.reservePriceLamports) score += 8;

  const now = Math.floor(Date.now() / 1000);
  const timeLeft = item.endTime - now;
  if (timeLeft > 0 && timeLeft < 86400) score += 12;
  if (timeLeft > 86400 && timeLeft < 172800) score += 6;

  return score;
}

export type IncentiveBotConfig = {
  minScore: number;
  maxBidLamportsPerItem: number;
  maxBidsPerCycle: number;
};

export const DEFAULT_INCENTIVE_CONFIG: IncentiveBotConfig = {
  minScore: 35,
  maxBidLamportsPerItem: 2 * 1e9,
  maxBidsPerCycle: 5,
};

export type IncentiveBotResult = {
  placed: { listingPda: string; bidLamports: number; score: number }[];
  skipped: { listingPda: string; reason: string }[];
};

function loadBotKeypair(): Keypair | null {
  const raw = process.env.INCENTIVE_BOT_SECRET_KEY?.trim();
  if (!raw) return null;
  try {
    const bytes = raw.startsWith("[")
      ? Uint8Array.from(JSON.parse(raw) as number[])
      : Uint8Array.from(Buffer.from(raw, "base64"));
    return Keypair.fromSecretKey(bytes);
  } catch {
    return null;
  }
}

/** Cron-safe cycle: score active auctions and place minimum competitive bids from fee pool wallet. */
export async function runIncentiveBotCycle(
  connection: Connection,
  config: IncentiveBotConfig = DEFAULT_INCENTIVE_CONFIG
): Promise<IncentiveBotResult> {
  const result: IncentiveBotResult = { placed: [], skipped: [] };
  const keypair = loadBotKeypair();
  if (!keypair) {
    result.skipped.push({ listingPda: "*", reason: "INCENTIVE_BOT_SECRET_KEY not configured" });
    return result;
  }

  const botPk = keypair.publicKey;
  const signerWallet = {
    publicKey: botPk,
    signTransaction: async (tx: any) => {
      tx.partialSign(keypair);
      return tx;
    },
    signAllTransactions: async (txs: any[]) => {
      txs.forEach((tx) => tx.partialSign(keypair));
      return txs;
    },
  };
  const program = getNftBayProgram(signerWallet as any, connection);
  const read = getNftBayReadProgram(connection);

  const all = await read.account.listing.all();
  const now = Math.floor(Date.now() / 1000);

  const candidates = all
    .filter(({ account }: any) => account.listingType === 1 && account.isActive && account.endTime.toNumber() > now)
    .map(({ publicKey, account }: any) => ({
      listingPda: publicKey.toString(),
      nftMint: account.nftMint.toString(),
      seller: account.seller.toString(),
      listingType: account.listingType,
      isPromoted: account.isPromoted,
      isActive: account.isActive,
      category: account.category || "General",
      neuroScore: account.neuroScore,
      endTime: account.endTime.toNumber(),
      highestBidLamports: account.highestBid.toNumber(),
      highestBidder: account.highestBidder?.toString(),
      reservePriceLamports: account.reservePrice?.toNumber?.() ?? 0,
      name: account.category || "Listing",
    }))
    .map((row) => ({ ...row, score: scoreIncentiveTarget(row as NftBayListingRecord) }))
    .filter((row) => row.score >= config.minScore)
    .sort((a, b) => b.score - a.score);

  let bidsPlaced = 0;

  for (const item of candidates) {
    if (bidsPlaced >= config.maxBidsPerCycle) break;

    if (item.seller === botPk.toString()) {
      result.skipped.push({ listingPda: item.listingPda, reason: "seller is bot" });
      continue;
    }
    if (item.highestBidder === botPk.toString()) {
      result.skipped.push({ listingPda: item.listingPda, reason: "bot already leading" });
      continue;
    }

    const minBid = computeMinNextBidLamports(item.highestBidLamports, item.reservePriceLamports || 0);
    if (minBid > config.maxBidLamportsPerItem) {
      result.skipped.push({ listingPda: item.listingPda, reason: "bid exceeds cap" });
      continue;
    }

    try {
      const listingPda = new PublicKey(item.listingPda);
      const prevBidder = item.highestBidder ? new PublicKey(item.highestBidder) : undefined;
      await placeAuctionBid(program, listingPda, botPk, new BN(minBid), prevBidder);
      result.placed.push({ listingPda: item.listingPda, bidLamports: minBid, score: item.score });
      bidsPlaced++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "bid failed";
      result.skipped.push({ listingPda: item.listingPda, reason: msg });
    }
  }

  return result;
}

/** Client-side: whether an auction qualifies for incentive bid attention (UI badge). */
export function showIncentiveBadge(item: MarketplaceItem): boolean {
  return scoreIncentiveTarget(item) >= DEFAULT_INCENTIVE_CONFIG.minScore;
}