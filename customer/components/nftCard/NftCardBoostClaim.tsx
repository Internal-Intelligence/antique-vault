import React from "react";

export interface NftCardBoostClaimProps {
  boostPercent: number;
  onClaim?: () => void;
}

const NftCardBoostClaim = React.memo(function NftCardBoostClaim({
  boostPercent,
  onClaim,
}: NftCardBoostClaimProps) {
  const handleClaim = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClaim?.();
  };

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={handleClaim}
        className="w-full text-[8px] py-0.5 bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-bold rounded active:scale-[0.97] border border-amber-500/70"
        aria-label={`Claim ${boostPercent}% booster share`}
      >
        <span aria-hidden="true">⚡ </span>
        CLAIM {boostPercent}% BOOSTER SHARE
      </button>
      <p className="text-center text-[7px] text-amber-400/70 mt-0.5 tracking-wider">
        Golden loop active
      </p>
    </div>
  );
});

NftCardBoostClaim.displayName = "NftCardBoostClaim";

export default NftCardBoostClaim;