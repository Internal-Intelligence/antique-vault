import type { NextApiRequest, NextApiResponse } from "next";
import { createIntakeTicket, getIntakeTicket } from "../../../lib/db/intake";
import { logActivity } from "../../../lib/db/activity";
import { upsertWarehouseItem } from "../../../lib/db/warehouse";
import { withDb } from "../../../lib/server/api";
import { requireMethod } from "../../../lib/server/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["GET", "POST"])) return;

  await withDb(req, res, async () => {
    if (req.method === "GET") {
      const id = typeof req.query.id === "string" ? req.query.id : null;
      if (!id) return res.status(400).json({ error: "id query required" });
      const ticket = await getIntakeTicket(id);
      if (!ticket) return res.status(404).json({ error: "Intake not found" });
      return res.status(200).json({ ok: true, ticket });
    }

    const body = req.body ?? {};
    const deviceName = String(body.deviceName || body.device_name || "").trim();
    const category = String(body.category || "Other E-Waste").trim();
    if (!deviceName && !category) {
      return res.status(400).json({ error: "deviceName or category required" });
    }

    const offerUsdCents = Math.round(Number(body.offerUsdCents ?? body.offer_usd_cents ?? 0));
    const walletPubkey = body.walletPubkey ?? body.wallet_pubkey ?? null;

    const ticket = await createIntakeTicket({
      walletPubkey: walletPubkey ? String(walletPubkey) : undefined,
      sellMode: body.sellMode ?? body.sell_mode,
      deviceName: deviceName || category,
      category,
      conditionTier: Number(body.conditionTier ?? body.condition ?? 3),
      isWorking: body.isWorking ?? body.is_working ?? true,
      weightLbs: body.weightLbs ?? body.weight_lbs,
      description: body.description,
      offerUsdCents,
      shipFromAddress: body.shipFromAddress ?? body.ship_from_address,
      formJson: body.form ?? body.formJson,
    });

    await upsertWarehouseItem({
      itemId: ticket.id,
      name: ticket.device_name,
      category: ticket.category,
      conditionGrade: ticket.condition_tier,
      status: "awaiting_shipment",
    });

    if (walletPubkey) {
      await logActivity({
        walletPubkey: String(walletPubkey),
        eventType: "intake",
        title: "Intake ticket created",
        meta: `${ticket.device_name} → warehouse`,
        valueText: `$${(offerUsdCents / 100).toFixed(2)}`,
        refId: ticket.id,
      });
    }

    return res.status(201).json({
      ok: true,
      ticket,
      shipTo: ticket.warehouse_address,
      trackingId: ticket.tracking_id,
    });
  });
}