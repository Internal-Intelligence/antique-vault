import { RECENT_SALES } from "./sellPageData";

export default function SellRecentlySold() {
  return (
    <section className="sell-browse-section">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="sell-browse-title">Recently sold on NFTBAY</h2>
          <p className="sell-browse-sub">Real payouts — sellers keep 92%+ after standard fees.</p>
        </div>
        <span className="sell-live-dot shrink-0">
          <span className="sell-live-pulse" />
          Live
        </span>
      </div>

      <div className="sell-recent-grid">
        {RECENT_SALES.map((sale) => (
          <div key={sale.id} className="sell-recent-card">
            <div className="sell-recent-icon">{sale.icon}</div>
            <div className="sell-recent-body">
              <p className="sell-recent-cat">{sale.category}</p>
              <h3 className="sell-recent-name">{sale.name}</h3>
              <div className="sell-recent-meta">
                <span className="sell-recent-price">${sale.soldFor}</span>
                <span className="sell-recent-ago">{sale.ago}</span>
              </div>
              <p className="sell-recent-buyer">Buyer @{sale.buyer}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}