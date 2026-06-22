import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Countdown from "./Countdown";
import IncentiveBidBadge from "./IncentiveBidBadge";
import {
  computeMinNextBidLamports,
  formatSolLamports,
  type MarketplaceItem,
} from "../../lib/nftbay";

export default function AuctionCard({
  item,
  onBid,
  onClaim,
  bidding,
  walletPk,
}: {
  item: MarketplaceItem;
  onBid: (item: MarketplaceItem, bidLamports: number) => void;
  onClaim?: (item: MarketplaceItem) => void;
  bidding?: boolean;
  walletPk?: string;
}) {
  const [bidSol, setBidSol] = useState("");
  const isAuction = item.listingType === 1 && !item.isVaultOnly;
  const pendingClaim = item.claimStatus === 1;
  const isWinner = pendingClaim && walletPk && item.buyer === walletPk;
  const currentBid = item.highestBidLamports || item.reservePriceLamports || item.priceLamports;
  const minBid = computeMinNextBidLamports(item.highestBidLamports, item.reservePriceLamports || 0);
  const endTime = pendingClaim ? item.claimDeadline ?? 0 : item.endTime;

  return (
    <motion.article whileHover={{ y: -2 }} className="auction-card glass-panel glass-panel--card">
      <div className="auction-card-header">
        <div>
          <h3 className="auction-card__name">{item.name}</h3>
          <p className="auction-card__meta">
            {item.category}
            {item.relistCount ? ` · 2nd chance #${item.relistCount}` : ""}
          </p>
        </div>
        <div className="auction-card__badges">
          <span className="auction-badge auction-badge--vault" title="Item in NFTBAY warehouse custody">
            Warehouse verified
          </span>
          <IncentiveBidBadge item={item} />
          {item.isPromoted && <span className="auction-badge auction-badge--boost">Promoted</span>}
          {pendingClaim && <span className="auction-badge auction-badge--claim">Awaiting claim</span>}
        </div>
      </div>

      {item.image && (
        <div className="auction-card-img-wrap">
          <img src={item.image} alt="" className="auction-card-img" />
        </div>
      )}

      <div className="auction-card-bid">
        <span className="auction-card-bid__label">{pendingClaim ? "Winning bid" : "Current bid"}</span>
        <span className="auction-card-bid__amount">
          {formatSolLamports(pendingClaim ? item.escrowedPotLamports ?? currentBid : currentBid)} SOL
        </span>
      </div>

      <p className="auction-card__timing">
        {pendingClaim ? "Claim deadline" : "Closes"}: <Countdown endTime={endTime} />
        {!pendingClaim && <> · Min next {formatSolLamports(minBid, 4)} SOL</>}
      </p>

      {isWinner && onClaim ? (
        <button type="button" className="btn-primary w-full text-sm" onClick={() => onClaim(item)}>
          Claim &amp; enter shipping
        </button>
      ) : isAuction && item.isActive ? (
        <div className="auction-card__bid-row">
          <input
            type="number"
            step="0.001"
            min={minBid / 1e9}
            placeholder={`${(minBid / 1e9).toFixed(3)} SOL min`}
            className="auction-input flex-1 text-sm"
            value={bidSol}
            onChange={(e) => setBidSol(e.target.value)}
            aria-label={`Bid amount for ${item.name}`}
          />
          <button
            type="button"
            className="btn-primary shrink-0 px-4 text-sm"
            disabled={bidding}
            onClick={() => {
              const lamports = Math.floor(parseFloat(bidSol || "0") * 1e9);
              onBid(item, lamports);
            }}
          >
            {bidding ? "…" : "Bid"}
          </button>
        </div>
      ) : (
        <p className="auction-card__vault-note">
          Vault preview — list as an auction from your vault to bid on-chain.
        </p>
      )}

      <Link href="/fees" className="auction-card__fees-link">
        Sellers keep 92%+ · fee funds inventory &amp; incentive bids
      </Link>
    </motion.article>
  );
}