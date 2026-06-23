import type { NextApiRequest, NextApiResponse } from "next";
import { getFeeAllocations } from "../../../lib/db/fees";
import { FEE_ALLOCATION } from "../../../lib/mission";
import { withDb } from "../../../lib/server/api";
import { requireMethod } from "../../../lib/server/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["GET"])) return;

  await withDb(req, res, async () => {
    const rows = await getFeeAllocations();
    return res.status(200).json({
      ok: true,
      policy: FEE_ALLOCATION,
      recorded: rows,
    });
  });
}