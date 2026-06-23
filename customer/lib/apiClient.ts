import type { Connection } from "@solana/web3.js";
import type { MarketplaceItem } from "./nftbay";
import { loadMarketplaceItems } from "./nftbay";
import type { PawnForm } from "./sell";
import type { Valuation } from "./sell";
import type { ActivityItem } from "../components/profile/types";

export async function fetchListings(
  refresh = false,
  connection?: Connection
): Promise<{ items: MarketplaceItem[]; source: "api" | "rpc" | "empty" }> {
  try {
    const res = await fetch(`/api/listings${refresh ? "?refresh=1" : ""}`);
    if (res.ok) {
      const data = await res.json();
      return { items: data.items ?? [], source: "api" };
    }
  } catch {
    /* fall through to RPC */
  }
  if (connection) {
    try {
      const items = await loadMarketplaceItems(connection);
      return { items, source: "rpc" };
    } catch {
      /* empty */
    }
  }
  return { items: [], source: "empty" };
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function mapDbActivity(rows: Record<string, unknown>[]): ActivityItem[] {
  return rows.map((row) => ({
    id: String(row.id),
    type: (row.event_type as ActivityItem["type"]) || "verify",
    title: String(row.title),
    meta: row.meta ? String(row.meta) : "",
    time: row.created_at ? formatRelativeTime(String(row.created_at)) : "",
    value: row.value_text ? String(row.value_text) : undefined,
  }));
}

export async function postIntake(payload: {
  walletPubkey?: string;
  sellMode?: string;
  deviceName: string;
  category: string;
  conditionTier?: number;
  isWorking?: boolean;
  weightLbs?: string;
  description?: string;
  offerUsdCents: number;
  shipFromAddress?: string;
  form?: PawnForm;
}) {
  const res = await fetch("/api/intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Intake failed");
  }
  return res.json();
}

export async function postValuation(form: PawnForm, walletPubkey?: string): Promise<Valuation> {
  const res = await fetch("/api/valuation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...form, walletPubkey }),
  });
  if (!res.ok) throw new Error("Valuation API failed");
  const data = await res.json();
  return data.valuation;
}

export async function createShippingLabel(payload: {
  intakeId: string;
  shipFromAddress: string;
  walletPubkey?: string;
}) {
  const res = await fetch("/api/shipping/label", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Shipping label failed");
  }
  return res.json();
}

export async function fetchActivity(wallet: string): Promise<ActivityItem[]> {
  const res = await fetch(`/api/activity?wallet=${encodeURIComponent(wallet)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return mapDbActivity(data.events ?? []);
}

export async function fetchFeeAllocations() {
  const res = await fetch("/api/fees/allocations");
  if (!res.ok) return null;
  return res.json();
}

export async function startVerifySession(walletPubkey: string) {
  const res = await fetch("/api/verify/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletPubkey }),
  });
  if (!res.ok) return null;
  return res.json();
}