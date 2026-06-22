export type SellMode = "intake" | "list" | "auction" | "pawn" | "mailin";

export type SellModeDef = {
  id: SellMode;
  title: string;
  subtitle: string;
  outcome: string;
  icon: string;
  tone: "emerald" | "sky" | "amber" | "violet";
};

export const SELL_MODE_DEFS: SellModeDef[] = [
  {
    id: "intake",
    title: "Ship new item",
    subtitle: "Vault intake",
    outcome: "AI offer → warehouse → NFT mint",
    icon: "📦",
    tone: "emerald",
  },
  {
    id: "list",
    title: "List fixed price",
    subtitle: "From your vault",
    outcome: "Set price on an item already in custody",
    icon: "🏷️",
    tone: "sky",
  },
  {
    id: "auction",
    title: "Start auction",
    subtitle: "Timed sale",
    outcome: "Transparent bids on a vault-backed NFT",
    icon: "⏱️",
    tone: "amber",
  },
  {
    id: "pawn",
    title: "Pawn for SOL",
    subtitle: "Quick liquidity",
    outcome: "Collateral loan against warehouse-held gear",
    icon: "💳",
    tone: "violet",
  },
  {
    id: "mailin",
    title: "Mail-in e-waste",
    subtitle: "Recycle bundle",
    outcome: "Ship electronics under 15 lbs — escrow until receipt",
    icon: "♻️",
    tone: "emerald",
  },
];

export function modeStartsIntake(mode: SellMode): boolean {
  return mode === "intake" || mode === "pawn" || mode === "mailin";
}

export function modeLabel(mode: SellMode | null): string {
  if (!mode) return "Sell";
  return SELL_MODE_DEFS.find((m) => m.id === mode)?.title ?? "Sell";
}