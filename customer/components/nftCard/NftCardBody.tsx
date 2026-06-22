import React from "react";
import type { NftCardDerived, NftCardItem } from "../../lib/nftCard/types";

export interface NftCardBodyProps {
  item: NftCardItem;
  derived: NftCardDerived;
}

const NftCardBody = React.memo(function NftCardBody({ item, derived }: NftCardBodyProps) {
  const { conditionLabel, workingStatus, workingColor } = derived;

  return (
    <div>
      <h3 className="font-semibold text-[15px] leading-snug text-white tracking-[-0.1px] mb-0.5 line-clamp-2">
        {item.name}
      </h3>
      <p className="text-[11px] text-gray-500 font-mono tracking-[0.5px]">{item.itemId}</p>

      <div className="flex items-center justify-between text-xs mt-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Condition</span>
          <span className="font-medium text-gray-200">{conditionLabel}</span>
        </div>
        <div className={`text-[10px] font-mono ${workingColor}`}>
          {workingStatus} • {derived.rwaType}
        </div>
      </div>
    </div>
  );
});

NftCardBody.displayName = "NftCardBody";

export default NftCardBody;