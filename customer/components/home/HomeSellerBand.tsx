import Link from "next/link";

export default function HomeSellerBand() {
  return (
    <section className="home-seller-band glass-panel mb-12">
      <div className="home-seller-band-inner">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/80 mb-2">
            Sellers win here
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            That closet? It&apos;s sitting on SOL
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">
            List in minutes, get AI pricing, vault custody, and promoted reach — then watch payouts land.
            Keep more than legacy marketplaces. Feel good selling again.
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