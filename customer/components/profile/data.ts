import type { ActivityItem, IncomeAvenue, PrestigeBadgeDef } from "./types";

export const PRESTIGE_DEFS: PrestigeBadgeDef[] = [
  { id: "verified-commander", name: "Verified Seller", icon: "🛡️", detail: "Identity and wallet verified — buyers trust your listings.", how: "Complete ID verification on your first high-value action.", points: 120 },
  { id: "pawn-legend", name: "Pawn Legend", icon: "♟️", detail: "You've moved serious hardware through the vault pawn flow.", how: "Pawn 5+ devices into the vault.", points: 150 },
  { id: "auction-master", name: "Auction Master", icon: "🏛️", detail: "Won or closed high-stakes NFTBAY auctions.", how: "Win or close 3+ live auctions.", points: 180 },
  { id: "live-bidder", name: "Live Bidder", icon: "⚡", detail: "Active in real-time auction bidding.", how: "Place 10 successful live bids.", points: 90 },
  { id: "shipping-pro", name: "Shipping Pro", icon: "📦", detail: "Flawless shipping track record.", how: "Complete 3+ on-time shipping flows.", points: 110 },
  { id: "promoted-seller", name: "Promoted Seller", icon: "📈", detail: "Used promoted listings for extra visibility.", how: "List your first promoted listing.", points: 140 },
  { id: "top-collector", name: "Top Collector", icon: "💎", detail: "Elite vault with high-value tokenized assets.", how: "Hold 8+ high-value items in your vault.", points: 200 },
  { id: "social-influencer", name: "Referral Driver", icon: "📣", detail: "Your shares bring new sellers to the marketplace.", how: "Share 5+ sales or badges publicly.", points: 75 },
  { id: "first-sale", name: "First Sale", icon: "💰", detail: "Your first completed marketplace sale.", how: "Complete your first listing + sale.", points: 80 },
  { id: "loyal-commander", name: "Loyal Member", icon: "⭐", detail: "Consistent activity over 30+ days.", how: "Stay active with repeated vault interactions.", points: 130 },
  { id: "quantum-pioneer", name: "Power Seller", icon: "⚙️", detail: "High-volume seller using AI pricing tools.", how: "Use AI pricing 5+ times with active listings.", points: 95 },
  { id: "golden-loop-legend", name: "Portfolio Pro", icon: "🏆", detail: "Thriving seller portfolio with repeat sales.", how: "Reach high portfolio value with multiple sales.", points: 220 },
];

export const INCOME_AVENUES: IncomeAvenue[] = [
  {
    id: "shop",
    title: "Launch your shop",
    subtitle: "Branded storefront on NFTBAY",
    status: "beta",
    icon: "🏪",
    summary: "Your own seller page with custom banner, categories, and follower feed — like eBay Store, on-chain.",
    bullets: ["Custom URL & branding", "Category collections", "Follower notifications", "Shop-level analytics"],
    cta: "Join shop waitlist",
  },
  {
    id: "affiliate",
    title: "Boost affiliate",
    subtitle: "Earn when others sell",
    status: "live",
    icon: "🔗",
    summary: "Share promoted listings. When they sell, you earn a cut of the boost pool — no inventory required.",
    bullets: ["Unique referral links", "Up to 12% of gross on boosted sales", "Real-time earnings dashboard", "Payouts to your wallet"],
    cta: "Get affiliate link",
  },
  {
    id: "category-store",
    title: "Category storefront",
    subtitle: "Own a vertical (e.g. smartphones)",
    status: "soon",
    icon: "📱",
    summary: "Curate and monetize a category hub. Earn placement fees and promoted slots in your vertical.",
    bullets: ["Curated category landing", "Promoted slot revenue", "Seller onboarding tools", "GMV-based tier upgrades"],
    cta: "Notify me",
  },
  {
    id: "api",
    title: "Seller API & bulk",
    subtitle: "High-volume integrations",
    status: "soon",
    icon: "⚡",
    summary: "Connect inventory systems, bulk list from spreadsheets, and automate repricing for power sellers.",
    bullets: ["REST + webhook hooks", "Bulk list & update", "Inventory sync", "Enterprise fee tiers"],
    cta: "Request early access",
  },
  {
    id: "ewaste-mailin",
    title: "Mail-in e-waste",
    subtitle: "Ship devices → receive SOL",
    status: "live",
    icon: "♻️",
    summary: "Optional recycling program in your profile. Mail old electronics under 15 lbs — SOL stays in escrow until our vault confirms your shipment arrived.",
    bullets: ["Prepaid shipping label", "Escrow until receipt confirmed on-chain", "Phones, laptops, cables accepted", "Payout to your connected wallet"],
    cta: "How mail-in works",
  },
];

export function buildDemoActivity(itemCount: number, vaultValueCents: number): ActivityItem[] {
  const base: ActivityItem[] = [
    { id: "a1", type: "verify", title: "Seller verification started", meta: "Wallet connected", time: "2h ago" },
    { id: "a2", type: "list", title: "Listing draft saved", meta: "Promoted tier available", time: "Yesterday" },
  ];
  if (itemCount > 0) {
    base.unshift({
      id: "a0",
      type: "pawn",
      title: `${itemCount} asset${itemCount > 1 ? "s" : ""} in vault`,
      meta: "Ready to list or pawn",
      time: "Live",
      value: `$${(vaultValueCents / 100).toLocaleString()}`,
    });
  }
  return base.slice(0, 5);
}