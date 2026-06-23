import type { NextApiRequest, NextApiResponse } from "next";
import { Connection } from "@solana/web3.js";
import { processExpiredAuctionClaims, processExpiredAuctionSettles } from "../../../lib/auctionKeeper";
import { logCronRun } from "../../../lib/db/cron";
import { ensureSchema } from "../../../lib/db/migrate";
import { hasDatabase } from "../../../lib/db";
import { requireCronAuth, requireMethod } from "../../../lib/server/auth";
import { getKeeperProgram } from "../../../lib/server/keeper";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["GET", "POST"])) return;
  if (!requireCronAuth(req, res)) return;

  const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC || process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");
  const program = getKeeperProgram(connection);

  if (!program) {
    return res.status(503).json({
      ok: false,
      error: "KEEPER_SECRET_KEY or INCENTIVE_BOT_SECRET_KEY not configured",
    });
  }

  try {
    const settled = await processExpiredAuctionSettles(connection, program);
    const relisted = await processExpiredAuctionClaims(connection, program);
    const result = { settled, relisted };

    if (hasDatabase()) {
      await ensureSchema();
      await logCronRun("settle-auctions", result);
    }

    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Settle cron failed";
    return res.status(500).json({ ok: false, error: msg });
  }
}