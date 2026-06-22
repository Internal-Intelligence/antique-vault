import type { ActivityItem, IncomeAvenue, PrestigeBadgeDef } from "./types";

export const PRESTIGE_DEFS: PrestigeBadgeDef[] = [
  { id: "verified-commander", name: "Verified Seller", icon: "🛡️", detail: "Identity and wallet verified — buyers trust your listings.", how: "Complete ID verification on your first high-value action.", points: 120 },
  { id: "pawn-legend", name: "Pawn Pro", icon: "♟️", detail: "Completed multiple pawn transactions through warehouse custody.", how: "Pawn 5+ items through the marketplace.", points: 150 },
  { id: "auction-master", name: "Auction Closer", icon: "🏛️", detail: "Closed several NFTBAY auctions — as buyer or seller.", how: "Win or close 3+ live auctions.", points: 180 },
  { id: "live-bidder", name: "Active Bidder", icon: "⏱️", detail: "Participated in timed auctions with clear terms.", how: "Place 10 successful bids.", points: 90 },
  { id: "shipping-pro", name: "Shipping Pro", icon: "📦", detail: "Reliable warehouse intake and ship-out record.", how: "Complete 3+ on-time shipping flows.", points: 110 },
  { id: "promoted-seller", name: "Promoted Seller", icon: "📈", detail: "Used optional promoted placement for visibility.", how: "List your first promoted listing.", points: 140 },
  { id: "top-collector", name: "Vault Holder", icon: "💎", detail: "Substantial vault with verified high-value assets.", how: "Hold 8+ items in warehouse custody.", points: 200 },
  { id: "social-influencer", name: "Referral Driver", icon: "📣", detail: "Your shares bring new sellers to the marketplace.", how: "Share 5+ sales or badges publicly.", points: 75 },
  { id: "first-sale", name: "First Sale", icon: "💰", detail: "Your first completed marketplace sale.", how: "Complete your first listing and sale.", points: 80 },
  { id: "loyal-commander", name: "Loyal Member", icon: "⭐", detail: "Consistent activity over 30+ days.", how: "Stay active with repeated vault interactions.", points: 130 },
  { id: "quantum-pioneer", name: "Power Seller", icon: "⚙️", detail: "High-volume seller using AI pricing guidance.", how: "Use AI pricing 5+ times with active listings.", points: 95 },
  { id: "golden-loop-legend", name: "Portfolio Pro", icon: "🏆", detail: "Healthy seller portfolio with repeat sales.", how: "Reach high portfolio value with multiple sales.", points: 220 },
];

export const INCOME_AVENUES: IncomeAvenue[] = [
  {
    id: "shop",
    title: "Launch your shop",
    subtitle: "Branded storefront on NFTBAY",
    status: "beta",
    icon: "🏪",
    summary: "Your own seller page with categories and follower updates — vault-backed, on-chain.",
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
    bullets: ["Unique referral links", "Up to 12% of gross on boosted sales", "Earnings in your profile", "Payouts to your wallet"],
    cta: "Get affiliate link",
  },
  {
    id: "category-store",
    title: "Category storefront",
    subtitle: "Curate a vertical (e.g. smartphones)",
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
    summary: "Optional recycling program. Mail electronics under 15 lbs — SOL stays in escrow until the warehouse confirms receipt on-chain.",
    bullets: ["Prepaid shipping label", "Escrow until warehouse receipt", "Phones, laptops, cables accepted", "Payout to your connected wallet"],
    cta: "How mail-in works",
  },
];

export function buildDemoActivity(itemCount: number, vaultValueCents: number): ActivityItem[] {
  const base: ActivityItem[] = [
    { id: "a1", type: "verify", title: "Wallet connected", meta: "Profile synced", time: "2h ago" },
    { id: "a2", type: "verify", title: "Warehouse hub ready", meta: "Ship items for verification", time: "Yesterday" },
  ];
  if (itemCount > 0) {
    base.unshift({
      id: "a0",
      type: "verify",
      title: `${itemCount} item${itemCount > 1 ? "s" : ""} in vault`,
      meta: "Warehouse-verified custody",
      time: "Current",
      value: `$${(vaultValueCents / 100).toLocaleString()}`,
    });
  }
  return base.slice(0, 5);
}