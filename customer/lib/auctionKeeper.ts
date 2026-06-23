import { Connection, PublicKey } from "@solana/web3.js";
import {
  DEFAULT_RELIST_DURATION_SECONDS,
  forfeitAndRelist,
  getNftBayReadProgram,
  settleAuction,
} from "./nftbay";

/** Scan pending claims past deadline and relist (call from cron or admin). */
export async function processExpiredAuctionClaims(
  connection: Connection,
  signerProgram: any
): Promise<string[]> {
  const read = getNftBayReadProgram(connection);
  const all = await read.account.listing.all();
  const now = Math.floor(Date.now() / 1000);
  const relisted: string[] = [];

  for (const { publicKey, account } of all) {
    if (account.claimStatus !== 1) continue;
    const deadline = account.claimDeadline?.toNumber?.() ?? 0;
    if (now < deadline) continue;
    await forfeitAndRelist(signerProgram, publicKey, DEFAULT_RELIST_DURATION_SECONDS);
    relisted.push(publicKey.toString());
  }

  return relisted;
}

/** Settle ended auctions that still have bids (claim window opens). */
export async function processExpiredAuctionSettles(
  connection: Connection,
  signerProgram: any
): Promise<{ settled: string[]; skipped: { listingPda: string; reason: string }[] }> {
  const read = getNftBayReadProgram(connection);
  const all = await read.account.listing.all();
  const now = Math.floor(Date.now() / 1000);
  const settled: string[] = [];
  const skipped: { listingPda: string; reason: string }[] = [];

  for (const { publicKey, account } of all) {
    if (account.listingType !== 1) continue;
    if (!account.isActive) continue;
    if (account.endTime.toNumber() > now) continue;
    if (account.highestBidder.equals(PublicKey.default)) {
      skipped.push({ listingPda: publicKey.toString(), reason: "no bids" });
      continue;
    }
    try {
      await settleAuction(signerProgram, publicKey);
      settled.push(publicKey.toString());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "settle failed";
      skipped.push({ listingPda: publicKey.toString(), reason: msg });
    }
  }

  return { settled, skipped };
}

export async function fetchPendingClaimListings(connection: Connection) {
  const read = getNftBayReadProgram(connection);
  const all = await read.account.listing.all();
  return all
    .filter(({ account }: any) => account.claimStatus === 1)
    .map(({ publicKey, account }: any) => ({
      listingPda: publicKey.toString(),
      nftMint: account.nftMint.toString(),
      seller: account.seller.toString(),
      buyer: account.buyer.toString(),
      claimDeadline: account.claimDeadline.toNumber(),
      escrowedPotLamports: account.escrowedPot?.toNumber?.() ?? account.highestBid.toNumber(),
    }));
}