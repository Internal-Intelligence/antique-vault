import Layout from "../components/Layout";
import Link from "next/link";
import { FEE_ALLOCATION, MISSION_PILLARS, EXPANSION_ROADMAP } from "../lib/mission";

export default function MissionPage() {
  return (
    <Layout>
      <div className="mission-page max-w-3xl">
        <p className="mission-kicker">Our mission</p>
        <h1 className="page-title">Fees that help the world — not hype the room</h1>
        <p className="page-subtitle mb-10">
          NFTBAY marketplace fees recycle into real inventory, transparent incentive bids, and warehouse
          verification. The goal: deflationary deals on tech, jewelry, and cards — and a vault model that
          eventually reaches groceries and everyday goods.
        </p>

        <section className="mission-section glass-panel mb-8">
          <h2 className="mission-section-title">The golden loop</h2>
          <p className="mission-section-sub mb-6">
            Every sale feeds the flywheel. Sellers keep 92%+. The platform fee pool does the rest — on-chain,
            reported publicly.
          </p>
          <div className="mission-fee-bars">
            {FEE_ALLOCATION.map((row) => (
              <div key={row.label} className="mission-fee-row">
                <div className="mission-fee-row-head">
                  <span className="mission-fee-icon" aria-hidden>
                    {row.icon}
                  </span>
                  <span className="mission-fee-label">{row.label}</span>
                  <span className="mission-fee-pct">{row.pct}%</span>
                </div>
                <div className="mission-fee-track" aria-hidden>
                  <div className="mission-fee-fill" style={{ width: `${row.pct}%` }} />
                </div>
                <p className="mission-fee-desc">{row.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-6">
            Full rate schedule on{" "}
            <Link href="/fees" className="text-emerald-500/90 hover:underline">
              Fees &amp; pricing
            </Link>
            . Allocation targets are operational policy — disclosed here for transparency.
          </p>
        </section>

        <section className="mission-section mb-8">
          <h2 className="mission-section-title">Four pillars</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            {MISSION_PILLARS.map((p) => (
              <div key={p.title} className="mission-pillar glass-panel glass-panel--subtle">
                <span className="text-2xl mb-2 block" aria-hidden>
                  {p.icon}
                </span>
                <h3 className="font-semibold text-zinc-100">{p.title}</h3>
                <p className="text-sm text-zinc-500 mt-2 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mission-section glass-panel mb-8">
          <h2 className="mission-section-title">Incentive bid bot</h2>
          <p className="mission-section-sub mb-4">
            A fee-funded platform wallet watches auctions across NFTBAY. When a listing scores high on
            quality, category fit (tech, jewelry, cards), and vault verification, the bot places the minimum
            competitive bid — labeled clearly as{" "}
            <span className="text-zinc-300">NFTBAY incentive liquidity</span>.
          </p>
          <ul className="mission-list text-sm text-zinc-500 space-y-2">
            <li>Sellers get real bid activity on standout items — not manufactured urgency.</li>
            <li>Buyers see honest market depth before they commit.</li>
            <li>Bot never bids against itself and never bids on its own listings.</li>
            <li>Runs on a cron cycle; pubkey published for on-chain verification.</li>
          </ul>
          <Link href="/auctions" className="btn-secondary mt-6 inline-flex">
            View open auctions
          </Link>
        </section>

        <section className="mission-section mb-8">
          <h2 className="mission-section-title">Where we&apos;re headed</h2>
          <div className="space-y-4 mt-5">
            {EXPANSION_ROADMAP.map((phase) => (
              <div key={phase.phase} className="mission-roadmap glass-panel glass-panel--subtle">
                <div className="flex items-center gap-3 mb-3">
                  <span className="mission-roadmap-phase">{phase.phase}</span>
                  <h3 className="font-semibold text-zinc-100">{phase.title}</h3>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {phase.items.map((item) => (
                    <li key={item} className="mission-roadmap-tag">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/warehouse" className="btn-primary">
            Verification hub
          </Link>
          <Link href="/acquire" className="btn-secondary">
            Fund inventory
          </Link>
          <Link href="/" className="home-ghost-btn min-h-[44px]">
            Back to hub
          </Link>
        </div>
      </div>
    </Layout>
  );
}