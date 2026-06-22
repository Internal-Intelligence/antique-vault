import { RECENT_SALES } from "./sellPageData";

export default function SellSocialProof() {
  const samples = RECENT_SALES.slice(0, 4);

  return (
    <section className="sell-social-proof">
      <div className="sell-social-proof__head">
        <h2 className="sell-social-proof__title">Recent vault settlements</h2>
        <p className="sell-social-proof__sub">Real payouts after warehouse verification — no hype timers.</p>
      </div>
      <div className="sell-social-proof__row">
        {samples.map((sale) => (
          <div key={sale.id} className="sell-social-proof__chip">
            <span aria-hidden>{sale.icon}</span>
            <span className="sell-social-proof__name">{sale.name}</span>
            <span className="sell-social-proof__price">${sale.soldFor}</span>
          </div>
        ))}
      </div>
    </section>
  );
}