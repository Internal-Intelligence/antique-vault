import { CONDITIONS } from "../anchor";
import type { NftCardItem } from "../nftCard/types";
import type { PawnForm } from "./types";

export type SellMintStage = "draft" | "valued" | "shipping" | "minted";

const CATEGORY_VISUALS: Record<string, { icon: string; gradient: string }> = {
  Smartphones: { icon: "📱", gradient: "from-emerald-500/35 to-teal-950/80" },
  Laptops: { icon: "💻", gradient: "from-violet-500/35 to-indigo-950/80" },
  "Tablets & E-Readers": { icon: "📖", gradient: "from-sky-500/35 to-blue-950/80" },
  "Headphones & Audio": { icon: "🎧", gradient: "from-fuchsia-500/35 to-purple-950/80" },
  Wearables: { icon: "⌚", gradient: "from-rose-500/35 to-red-950/80" },
  "Handheld Gaming": { icon: "🎮", gradient: "from-amber-500/35 to-orange-950/80" },
  "Cameras & Photo": { icon: "📷", gradient: "from-cyan-500/35 to-slate-950/80" },
  "Chargers & Cables": { icon: "🔌", gradient: "from-lime-500/35 to-green-950/80" },
  "Other E-Waste": { icon: "♻️", gradient: "from-zinc-500/35 to-zinc-950/80" },
  Other: { icon: "✨", gradient: "from-emerald-500/25 to-zinc-950/80" },
};

const STAGE_STEPS: { key: SellMintStage; label: string }[] = [
  { key: "draft", label: "Describe item" },
  { key: "valued", label: "Lock offer" },
  { key: "shipping", label: "Ship to vault" },
  { key: "minted", label: "Mint NFT" },
];

function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function derivePreviewMint(form: PawnForm): string {
  const seed = `${form.category}|${form.deviceName}|${form.condition}|${form.isWorking}`;
  const h = hashString(seed);
  const short = h.toString(36).slice(0, 4).toUpperCase();
  const tail = (h % 1_000_000).toString().padStart(6, "0");
  return `NBAY${tail.slice(0, 4)}…${short}`;
}

export function derivePreviewItemId(form: PawnForm): string {
  const h = hashString(`${form.category}-${form.deviceName || "draft"}`);
  return `VLT-${(h % 1_000_000).toString().padStart(6, "0")}`;
}

export function getCategoryVisual(category: string) {
  return CATEGORY_VISUALS[category] ?? CATEGORY_VISUALS.Other;
}

export function getPreviewDisplayName(form: PawnForm): string {
  const name = form.deviceName.trim();
  if (name) return name;
  if (form.deviceStatusChosen) return `${form.category} listing`;
  return "Your device";
}

export function getMetadataProgress(form: PawnForm): number {
  let score = 0;
  if (form.deviceStatusChosen) score += 18;
  if (form.deviceName.trim()) score += 28;
  if (form.category) score += 12;
  if (form.description.trim()) score += 18;
  if (form.weightLbs) score += 12;
  if (form.hasIssues !== null || !form.isWorking) score += 12;
  return Math.min(100, score);
}

export function buildPreviewNftItem(
  form: PawnForm,
  opts?: { offerUsd?: number; boosted?: boolean; boostPercent?: number },
): NftCardItem {
  return {
    nftMint: derivePreviewMint(form),
    name: getPreviewDisplayName(form),
    itemId: derivePreviewItemId(form),
    condition: form.condition,
    category: form.category,
    status: 0,
    boosted: opts?.boosted,
    boostPercent: opts?.boostPercent,
    aiOfferValueCents: opts?.offerUsd ? Math.round(opts.offerUsd * 100) : undefined,
  };
}

export function getMintStageLabel(stage: SellMintStage): string {
  switch (stage) {
    case "draft":
      return "Drafting metadata";
    case "valued":
      return "Ready after you accept";
    case "shipping":
      return "Mint queued at vault";
    case "minted":
      return "Minted to your wallet";
  }
}

export function getMintStageIndex(stage: SellMintStage): number {
  return STAGE_STEPS.findIndex((s) => s.key === stage);
}

export { STAGE_STEPS, CONDITIONS };