import { isIncentiveBidder, showIncentiveBadge } from "../../lib/incentiveBot";
import type { MarketplaceItem } from "../../lib/nftbay";

export default function IncentiveBidBadge({ item }: { item: MarketplaceItem }) {
  const botLeading = isIncentiveBidder(item.highestBidder);
  const eligible = showIncentiveBadge(item);

  if (!botLeading && !eligible) return null;

  return (
    <span
      className={`auction-badge ${botLeading ? "auction-badge--incentive-active" : "auction-badge--incentive"}`}
      title="NFTBAY incentive liquidity — fee-funded minimum bids on standout vault-verified listings. Transparent, never self-bidding."
    >
      {botLeading ? "NFTBAY incentive bid" : "Incentive eligible"}
    </span>
  );
}