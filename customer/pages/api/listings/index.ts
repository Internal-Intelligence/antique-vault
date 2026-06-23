import type { NextApiRequest, NextApiResponse } from "next";
import { Connection } from "@solana/web3.js";
import { loadMarketplaceItems } from "../../../lib/nftbay";
import { getCachedListings, setCachedListings } from "../../../lib/db/listings-cache";
import { withDb } from "../../../lib/server/api";
import { requireMethod } from "../../../lib/server/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["GET"])) return;

  const force = req.query.refresh === "1";

  await withDb(req, res, async () => {
    if (!force) {
      const cached = await getCachedListings();
      if (cached) {
        return res.status(200).json({
          ok: true,
          source: "cache",
          fetchedAt: cached.fetchedAt,
          items: cached.items,
        });
      }
    }

    const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC || process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
    const connection = new Connection(rpc, "confirmed");
    const items = await loadMarketplaceItems(connection);
    await setCachedListings(items);

    return res.status(200).json({
      ok: true,
      source: "rpc",
      fetchedAt: Date.now(),
      items,
    });
  });
}