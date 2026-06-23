import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { getSql } from "../../../lib/db";
import { recordFeeEvent } from "../../../lib/db/fees";
import { ensureSchema } from "../../../lib/db/migrate";
import { hasDatabase } from "../../../lib/db";

export const config = { api: { bodyParser: false } };

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!secret || !stripeKey) {
    return res.status(503).json({ error: "Stripe not configured" });
  }

  const stripe = new Stripe(stripeKey);
  const raw = await readRawBody(req);
  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") {
    return res.status(400).json({ error: "Missing stripe-signature" });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    return res.status(400).json({ error: msg });
  }

  if (hasDatabase()) {
    await ensureSchema();
    const sql = getSql();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await sql`
        UPDATE stripe_checkouts
        SET status = 'completed'
        WHERE session_id = ${session.id}
      `;
      const amount = session.amount_total ?? 0;
      await recordFeeEvent("Public transparency", 0, `Stripe boost $${(amount / 100).toFixed(2)}`);
    }
  }

  return res.status(200).json({ received: true });
}