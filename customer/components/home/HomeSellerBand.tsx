import Link from "next/link";

export default function HomeSellerBand() {
  return (
    <section className="home-seller-band mb-12">
      <div className="home-seller-band-inner">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/80 mb-2">
            Sellers win here
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            Turn dusty gear into on-chain income
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">
            AI pricing, vault custody, promoted listings, pawn offers, and affiliate boosts — keep more than
            legacy marketplaces with fees you can actually read.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sell" className="btn-primary">
              Start selling
            </Link>
            <Link href="/fees" className="btn-secondary">
              See fee breakdown
            </Link>
            <Link href="/acquire" className="home-ghost-btn">
              Fund inventory rounds
            </Link>
          </div>
        </div>
        <div className="home-seller-metrics">
          <div>
            <div className="text-3xl font-bold text-emerald-400 tabular-nums">5%</div>
            <div className="text-xs text-zinc-500">standard fee</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-amber-400 tabular-nums">8%</div>
            <div className="text-xs text-zinc-500">promoted max</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white tabular-nums">∞</div>
            <div className="text-xs text-zinc-500">categories</div>
          </div>
        </div>
      </div>
    </section>
  );
}