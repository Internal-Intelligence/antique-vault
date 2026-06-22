type Stats = {
  live: number;
  endingSoon: number;
  incentiveEligible: number;
  botLeading: number;
};

export default function AuctionStatsRow({ stats }: { stats: Stats }) {
  const items = [
    { label: "Live auctions", value: stats.live },
    { label: "Ending in 24h", value: stats.endingSoon },
    { label: "Incentive eligible", value: stats.incentiveEligible },
    { label: "NFTBAY bids leading", value: stats.botLeading },
  ];

  return (
    <div className="auctions-stats" role="list" aria-label="Auction overview">
      {items.map((item) => (
        <div key={item.label} className="auctions-stats__chip" role="listitem">
          <span className="auctions-stats__value">{item.value}</span>
          <span className="auctions-stats__label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}