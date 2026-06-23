import type { NextApiRequest, NextApiResponse } from "next";
import { getWarehouseItem, getWarehouseByMint, upsertWarehouseItem } from "../../../lib/db/warehouse";
import { withDb } from "../../../lib/server/api";
import { requireMethod } from "../../../lib/server/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["GET", "PATCH"])) return;

  const itemId = typeof req.query.itemId === "string" ? req.query.itemId : null;
  if (!itemId) return res.status(400).json({ error: "itemId required" });

  await withDb(req, res, async () => {
    if (req.method === "PATCH") {
      const adminKey = process.env.ADMIN_API_KEY;
      if (adminKey && req.headers["x-admin-key"] !== adminKey) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const body = req.body ?? {};
      await upsertWarehouseItem({
        itemId,
        nftMint: body.nftMint,
        name: body.name,
        category: body.category,
        conditionGrade: body.conditionGrade,
        status: body.status,
        qHash: body.qHash,
        paperworkVerified: body.paperworkVerified,
      });
    }

    let item = await getWarehouseItem(itemId);
    if (!item && itemId.length > 32) {
      item = await getWarehouseByMint(itemId);
    }

    if (!item) {
      return res.status(404).json({
        error: "Warehouse record not found",
        hint: "Item appears after intake ticket is created",
      });
    }

    return res.status(200).json({ ok: true, item });
  });
}