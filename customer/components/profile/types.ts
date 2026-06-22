export type ProfileTab = "overview" | "inventory" | "earn" | "expand";

export const PROFILE_TABS: ProfileTab[] = ["overview", "inventory", "earn", "expand"];

export function parseProfileTab(value: string | string[] | undefined): ProfileTab | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && PROFILE_TABS.includes(raw as ProfileTab) ? (raw as ProfileTab) : null;
}

export interface ProfileNextAction {
  title: string;
  desc: string;
  href: string;
  cta: string;
  onClick?: () => void;
}

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