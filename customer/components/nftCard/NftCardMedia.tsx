import React from "react";
import type { NftCardItem, NftCardDerived } from "../../lib/nftCard/types";

export interface NftCardBoostDisplay {
  boosted: boolean;
  boostPercent: number;
}

export interface NftCardMediaProps {
  image: string | null;
  loading?: boolean;
  item: NftCardItem;
  derived: NftCardDerived;
  trustScore: number;
}

const NftCardMedia = React.memo(function NftCardMedia({
  image,
  loading = false,
  item,
  derived,
  trustScore,
}: NftCardMediaProps) {
  const boostPercent = item.boostPercent ?? 8;

  return (
    <div className="aspect-square bg-[#0a0f0d] relative overflow-hidden">
      {image ? (
        <img
          src={image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-[1.035] transition-transform duration-[180ms]"
          loading="lazy"
        />
      ) : loading ? (
        <div
          className="w-full h-full flex items-center justify-center bg-[#0c1210]"
          role="status"
          aria-label="Loading image"
        >
          <div className="w-7 h-7 border border-[#22ffaa]/30 border-t-[#22ffaa] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#0c1210] text-[10px] text-gray-600">
          No image
        </div>
      )}

      <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5">
        <div className="quantum-badge text-[#22ffaa] border-[#22ffaa]/30">{derived.rwaType}</div>
        <div
          className="quantum-badge quantum-score text-[10px] border-[#22ffaa]/20"
          title="Trust match score"
        >
          Q{trustScore}
        </div>
        {item.boosted && (
          <div
            className="quantum-badge text-amber-300 border-amber-500/60 bg-gradient-to-r from-amber-500/20 to-yellow-400/10 text-[9px] flex items-center gap-0.5"
            title={`Boosted ${boostPercent}%`}
          >
            ⚡ BOOSTED +{boostPercent}%
          </div>
        )}
      </div>

      <div className="absolute bottom-2.5 left-2.5">
        {derived.isRedeemed ? (
          <span className="quantum-badge text-red-400 border-red-900/40">REDEEMED</span>
        ) : (
          <span className="quantum-badge text-[#22ffaa] border-[#22ffaa]/30">
            STORED • {derived.workingStatus}
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#22ffaa]/60 to-transparent opacity-40 group-hover:opacity-70" />
    </div>
  );
});

NftCardMedia.displayName = "NftCardMedia";

export default NftCardMedia;