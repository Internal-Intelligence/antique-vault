import React from "react";

export interface NftCardFooterProps {
  showPromoted?: boolean;
}

const NftCardFooter = React.memo(function NftCardFooter({
  showPromoted = false,
}: NftCardFooterProps) {
  if (!showPromoted) return null;

  return (
    <div className="px-4 pb-3 -mt-1 flex justify-end items-center text-[8px] text-gray-600 font-mono">
      <span className="promoted-badge text-[8px] py-px">PROMOTED</span>
    </div>
  );
});

NftCardFooter.displayName = "NftCardFooter";

export default NftCardFooter;