import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { getSql } from "../../../lib/db";
import { newId } from "../../../lib/db/ids";
import { withDb } from "../../../lib/server/api";
import { requireMethod } from "../../../lib/server/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["POST"])) return;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(503).json({ error: "STRIPE_SECRET_KEY not configured" });
  }

  await withDb(req, res, async () => {
    const { walletPubkey, nftMint, amountCents = 900, listingMode = "fixed" } = req.body ?? {};
    if (!walletPubkey || !nftMint) {
      return res.status(400).json({ error: "walletPubkey and nftMint required" });
    }

    const stripe = new Stripe(stripeKey);
    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://nftbay.vercel.app";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Number(amountCents),
            product_data: {
              name: "NFTBAY listing boost",
              description: `Promoted visibility for ${nftMint}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/market?boost=1`,
      cancel_url: `${origin}/fees`,
      metadata: {
        walletPubkey: String(walletPubkey),
        nftMint: String(nftMint),
        listingMode: String(listingMode),
      },
    });

    const sql = getSql();
    await sql`
      INSERT INTO stripe_checkouts (id, session_id, wallet_pubkey, nft_mint, listing_mode, amount_cents, status)
      VALUES (${newId("CHK")}, ${session.id}, ${String(walletPubkey)}, ${String(nftMint)}, ${String(listingMode)}, ${Number(amountCents)}, 'pending')
    `;

    return res.status(200).json({ ok: true, url: session.url, sessionId: session.id });
  });
}