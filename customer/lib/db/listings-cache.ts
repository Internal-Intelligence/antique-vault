import { getSql } from "./index";
import type { MarketplaceItem } from "../nftbay";

const CACHE_ID = "marketplace";
const TTL_MS = 30_000;

export async function getCachedListings(): Promise<{ items: MarketplaceItem[]; fetchedAt: number } | null> {
  const sql = getSql();
  const rows = await sql`SELECT payload, fetched_at FROM listings_cache WHERE id = ${CACHE_ID} LIMIT 1`;
  if (!rows[0]) return null;
  const row = rows[0] as { payload: MarketplaceItem[]; fetched_at: string };
  const fetchedAt = new Date(row.fetched_at).getTime();
  if (Date.now() - fetchedAt > TTL_MS) return null;
  return { items: row.payload, fetchedAt };
}

export async function setCachedListings(items: MarketplaceItem[]) {
  const sql = getSql();
  await sql`
    INSERT INTO listings_cache (id, payload, fetched_at)
    VALUES (${CACHE_ID}, ${JSON.stringify(items)}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, fetched_at = NOW()
  `;
}