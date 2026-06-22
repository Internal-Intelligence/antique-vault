import Link from "next/link";

export default function SellTrustStrip() {
  return (
    <section className="sell-trust-strip sell-glass-panel">
      <div className="sell-trust-strip__item">
        <span className="sell-trust-strip__icon" aria-hidden>🏦</span>
        <div>
          <p className="sell-trust-strip__label">Warehouse verified</p>
          <p className="sell-trust-strip__desc">Every item passes through the NFTBAY hub before it trades.</p>
        </div>
        <Link href="/warehouse" className="sell-trust-strip__link">
          Learn more
        </Link>
      </div>
      <div className="sell-trust-strip__item">
        <span className="sell-trust-strip__icon" aria-hidden>💰</span>
        <div>
          <p className="sell-trust-strip__label">Keep 92%+</p>
          <p className="sell-trust-strip__desc">Transparent 5% standard fee — escrow on every sale.</p>
        </div>
        <Link href="/fees" className="sell-trust-strip__link">
          Fee schedule
        </Link>
      </div>
      <div className="sell-trust-strip__item">
        <span className="sell-trust-strip__icon" aria-hidden>✨</span>
        <div>
          <p className="sell-trust-strip__label">NFT-backed</p>
          <p className="sell-trust-strip__desc">Real item in custody — preview your token as you list.</p>
        </div>
        <Link href="/mission" className="sell-trust-strip__link">
          Our mission
        </Link>
      </div>
    </section>
  );
}