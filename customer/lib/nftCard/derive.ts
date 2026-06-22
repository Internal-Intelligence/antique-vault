import { CONDITIONS } from "../anchor";
import type {
  BubbleQuestion,
  NftCardItem,
  NftCardDerived,
  TrustBadge,
  TrustBadgeKey,
} from "./types";

function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Stable trust score (88–99) from item id — no randomness. */
export function deterministicTrustScore(itemId: string): number {
  return 88 + (hashString(itemId) % 12);
}

/** Promoted badge when boosted or deterministically eligible from item id. */
export function showPromotedBadge(item: NftCardItem): boolean {
  if (item.boosted) return true;
  return hashString(item.itemId) % 3 === 0;
}

export function getBubbleQuestions(): BubbleQuestion[] {
  return [
    { label: "Paper OK?", tip: "Admin verified paperwork hash" },
    { label: "Ship proof?", tip: "On-chain shipping proof appended" },
    { label: "AI safe?", tip: "Hash of AI decision logged on chain" },
    { label: "Pawn claim?", tip: "On-chain claim via expiry or repay" },
    { label: "BOOST?", tip: "NFTBAY Boost: fee + share of sold proceeds to booster" },
    { label: "GOLDEN?", tip: "Fees fuel treasury and boost volume loop" },
  ];
}

export function deriveNftCard(item: NftCardItem): NftCardDerived {
  const isRedeemed = item.status === 1;
  const conditionLabel = CONDITIONS[item.condition] || "Unknown";
  const rwaType = item.category || "Physical RWA";
  const workingStatus = item.condition >= 3 ? "WORKING" : "NON-WORKING";
  const workingColor = item.condition >= 3 ? "text-emerald-400" : "text-orange-400";

  const trustBadges: Record<TrustBadgeKey, TrustBadge> = {
    esc: { active: true, label: "ESC", title: "Enhanced Escrow active" },
    paper: {
      active: !!(item.status && item.status >= 2),
      label: "PAPER",
      title: "Paperwork verified",
    },
    ship: {
      active: !!(item.status && item.status >= 3),
      label: "SHIP",
      title: "Shipping proof on chain",
    },
    pawn: { active: !!item.isPawned, label: "PAWN", title: "Pawn claim ready" },
    aiOffer: {
      active: !!item.aiOfferValueCents,
      label: "AI-O",
      title: "Auditable AI offer",
    },
  };

  return {
    isRedeemed,
    conditionLabel,
    rwaType,
    workingStatus,
    workingColor,
    showPromoted: showPromotedBadge(item),
    trustBadges,
  };
}