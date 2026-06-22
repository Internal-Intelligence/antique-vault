export type ProfileTab = "overview" | "inventory" | "earn" | "expand";

export interface PrestigeBadgeDef {
  id: string;
  name: string;
  icon: string;
  detail: string;
  how: string;
  points: number;
}

export interface IncomeAvenue {
  id: string;
  title: string;
  subtitle: string;
  status: "live" | "beta" | "soon";
  icon: string;
  summary: string;
  bullets: string[];
  cta: string;
}

export interface ActivityItem {
  id: string;
  type: "sale" | "list" | "pawn" | "bid" | "verify";
  title: string;
  meta: string;
  time: string;
  value?: string;
}

export interface EarningsSnapshot {
  totalEarned: number;
  pendingPayout: number;
  feesPaid: number;
  boostRevenue: number;
  affiliateShare: number;
  shopRevenue: number;
}