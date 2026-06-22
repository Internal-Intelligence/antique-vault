import React, { useCallback, useState } from "react";
import Link from "next/link";
import type { NftCardItem, NftCardMode } from "../../lib/nftCard/types";

export interface NftCardActionsProps {
  item: NftCardItem;
  mode?: NftCardMode;
  onStore?: () => void;
  onList?: () => void;
}

const NftCardActions = React.memo(function NftCardActions({
  item,
  mode = "portfolio",
  onStore,
  onList,
}: NftCardActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      try {
        await navigator.clipboard.writeText(item.nftMint);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
    },
    [item.nftMint],
  );

  return (
    <div className="grid grid-cols-3 gap-1.5 pt-1">
      {mode === "portfolio" ? (
        <>
          <Link
            href={`/redeem/${item.nftMint}`}
            className="ios-btn ios-btn-primary text-center text-xs py-2"
            onClick={(e) => e.stopPropagation()}
          >
            Redeem
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStore?.();
            }}
            className="ios-btn ios-btn-secondary text-xs py-2"
          >
            Store
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onList?.();
            }}
            className="ios-btn ios-btn-secondary text-xs py-2"
          >
            Sell
          </button>
        </>
      ) : (
        <>
          <a
            href={`https://magiceden.io/item-details/${item.nftMint}`}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 ios-btn ios-btn-primary text-center text-xs py-2"
            onClick={(e) => e.stopPropagation()}
          >
            Buy on Magic Eden
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="ios-btn ios-btn-secondary text-xs py-2"
            aria-live="polite"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </>
      )}
    </div>
  );
});

NftCardActions.displayName = "NftCardActions";

export default NftCardActions;