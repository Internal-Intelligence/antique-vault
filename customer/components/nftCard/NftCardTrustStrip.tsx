import React, { useCallback, useId, useState } from "react";
import { getBubbleQuestions } from "../../lib/nftCard/derive";
import type {
  NftCardDerived,
  NftCardItem,
  TrustBadge,
  TrustBadgeKey,
} from "../../lib/nftCard/types";

const TRUST_BADGE_ORDER: TrustBadgeKey[] = ["esc", "paper", "ship", "pawn", "aiOffer"];

export interface NftCardTrustStripProps {
  item: NftCardItem;
  derived: NftCardDerived;
  trustBadges: Record<TrustBadgeKey, TrustBadge>;
  onBubblePress?: (label: string) => void;
}

const NftCardTrustStrip = React.memo(function NftCardTrustStrip({
  item,
  derived,
  trustBadges,
  onBubblePress,
}: NftCardTrustStripProps) {
  const detailId = useId();
  const [expandedBubble, setExpandedBubble] = useState<string | null>(null);
  const bubbleQuestions = getBubbleQuestions();
  const trustChainStatus = item.trustChainHash ? "SECURED" : "GENESIS";

  const handleBubbleClick = useCallback(
    (label: string, event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      setExpandedBubble((prev) => (prev === label ? null : label));
      onBubblePress?.(label);
    },
    [onBubblePress],
  );

  return (
    <div className="pt-1.5 border-t border-white/5">
      <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400/80 mb-0.5">
        <span>TRUST CHAIN</span>
        <span
          className="px-1 py-px rounded bg-emerald-500/10 text-emerald-400"
          title={`Trust chain status: ${trustChainStatus}`}
        >
          Q-HASH
        </span>
      </div>

      <div className="flex flex-wrap gap-1 text-[9px]" role="list" aria-label="Trust badges">
        {TRUST_BADGE_ORDER.map((key) => {
          const badge = trustBadges[key];
          return (
            <span
              key={key}
              role="listitem"
              className={`px-1.5 py-px rounded-full ${
                badge.active
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-white/5 text-white/50"
              }`}
              title={badge.title}
            >
              {badge.label}
            </span>
          );
        })}
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1" role="group" aria-label="Trust questions">
        {bubbleQuestions.map((bubble) => {
          const isExpanded = expandedBubble === bubble.label;
          return (
            <button
              key={bubble.label}
              type="button"
              onClick={(e) => handleBubbleClick(bubble.label, e)}
              className="text-[8px] px-2 py-0.5 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/50 rounded-full transition text-white/60 hover:text-emerald-300 active:scale-95"
              title={bubble.tip}
              aria-expanded={isExpanded}
              aria-controls={isExpanded ? `${detailId}-${bubble.label}` : undefined}
            >
              {bubble.label}
            </button>
          );
        })}
      </div>

      {expandedBubble && (
        <p
          id={`${detailId}-${expandedBubble}`}
          className="mt-1.5 text-[9px] text-emerald-300/80 leading-relaxed px-1"
          role="status"
        >
          {bubbleQuestions.find((b) => b.label === expandedBubble)?.tip}
          <span className="text-white/40">
            {" "}
            • Trust chain: {trustChainStatus}
            {derived.showPromoted ? " • Promoted listing" : ""}
          </span>
        </p>
      )}
    </div>
  );
});

NftCardTrustStrip.displayName = "NftCardTrustStrip";

export default NftCardTrustStrip;