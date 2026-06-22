import type { NextApiRequest, NextApiResponse } from "next";
import { Connection } from "@solana/web3.js";
import { runIncentiveBotCycle } from "../../../lib/incentiveBot";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");

  try {
    const result = await runIncentiveBotCycle(connection);
    return res.status(200).json({
      ok: true,
      placed: result.placed.length,
      skipped: result.skipped.length,
      detail: result,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Incentive bot failed";
    return res.status(500).json({ ok: false, error: msg });
  }
}