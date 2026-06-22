import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import type { NftCardItem, NftCardMode } from "../../lib/nftCard/types";

export interface NftCardActionsProps {
  item: NftCardItem;
  mode?: NftCardMode;
  onStore?: () => void;
  onList?: () => void;
  onBuy?: () => void;
  buying?: boolean;
}

const NftCardActions = React.memo(function NftCardActions({
  item,
  mode = "portfolio",
  onStore,
  onList,
  onBuy,
  buying = false,
}: NftCardActionsProps) {
  const { connected } = useWallet();
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
    [item.nftMint]
  );

  const handleBuy = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (!connected) {
        alert("Connect your wallet to buy on NFTBAY.");
        return;
      }
      onBuy?.();
    },
    [connected, onBuy]
  );

  const priceLabel =
    item.priceUsd != null && item.priceUsd > 0
      ? `$${item.priceUsd >= 1 ? item.priceUsd.toFixed(0) : item.priceUsd.toFixed(2)}`
      : item.appraisedValueUsdCents
        ? `$${(item.appraisedValueUsdCents / 100).toFixed(0)}`
        : null;

  return (
    <div className="space-y-1.5 pt-1">
      {mode === "market" && priceLabel && (
        <div className="text-center text-sm font-semibold text-[#22ffaa] tabular-nums">
          {item.isVaultOnly ? `Est. ${priceLabel}` : priceLabel}
          {item.isVaultOnly && (
            <span className="block text-[10px] text-amber-400/80 font-normal">Not listed on NFTBAY</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5">
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
            <button
              type="button"
              onClick={handleBuy}
              disabled={buying || item.isVaultOnly || !onBuy}
              className="col-span-2 ios-btn ios-btn-primary text-xs py-2 disabled:opacity-50"
              title={
                item.isVaultOnly
                  ? "Seller must list on NFTBAY first"
                  : !connected
                    ? "Connect wallet to buy"
                    : undefined
              }
            >
              {buying ? "Buying…" : item.isVaultOnly ? "List to buy" : "Buy on NFTBAY"}
            </button>
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
    </div>
  );
});

NftCardActions.displayName = "NftCardActions";

export default NftCardActions;