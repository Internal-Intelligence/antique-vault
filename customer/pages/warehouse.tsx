import Layout from "../components/Layout";
import Link from "next/link";
import { WAREHOUSE_HUB, WAREHOUSE_STEPS } from "../lib/mission";

export default function WarehousePage() {
  return (
    <Layout>
      <div className="warehouse-page max-w-3xl">
        <p className="mission-kicker">Verification hub</p>
        <h1 className="page-title">{WAREHOUSE_HUB.name}</h1>
        <p className="page-subtitle mb-2">{WAREHOUSE_HUB.location}</p>
        <p className="text-sm text-zinc-500 mb-10 leading-relaxed">{WAREHOUSE_HUB.tagline}</p>

        <section className="warehouse-hero glass-panel mb-8">
          <p className="text-sm text-zinc-400 leading-relaxed">
            NFTBAY does not list mystery inventory. Every tradeable NFT maps to a physical unit that passed
            through this warehouse — scanned, graded, insured, and recorded on-chain before it ever hits the
            market. That is the trust layer behind tech deals, jewelry, cards, and everything we expand into
            next.
          </p>
          <div className="warehouse-caps mt-6">
            {WAREHOUSE_HUB.capabilities.map((cap) => (
              <span key={cap} className="home-pill">
                {cap}
              </span>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mission-section-title">Intake → verify → trade</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            {WAREHOUSE_STEPS.map((step) => (
              <div key={step.step} className="home-step-card glass-panel glass-panel--subtle">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl" aria-hidden>
                    {step.icon}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-500/80">{step.step}</span>
                </div>
                <h3 className="font-semibold text-[16px] mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="warehouse-trust glass-panel glass-panel--subtle mb-8">
          <h2 className="mission-section-title text-base">On every NFT card</h2>
          <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
            Look for the <strong className="text-zinc-300">TRUST CHAIN</strong> and{" "}
            <strong className="text-zinc-300">Q-HASH</strong> strip on listings — escrow, paperwork, ship
            proof, and AI appraisal badges all trace back to warehouse intake. Dispute-ready records live
            on-chain and in custody logs.
          </p>
        </section>

        <section className="mb-10 text-sm text-zinc-500 leading-relaxed space-y-3">
          <p>
            <strong className="text-zinc-300">Selling?</strong> Ship your item to the warehouse after listing.
            The sell flow walks you through labels and tracking.
          </p>
          <p>
            <strong className="text-zinc-300">Buying?</strong> Custody stays in the vault until you redeem or
            resell. Burn the NFT to ship the physical item to your door.
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/sell" className="btn-primary">
            Start selling
          </Link>
          <Link href="/mission" className="btn-secondary">
            Our mission
          </Link>
          <Link href="/fees" className="home-ghost-btn min-h-[44px]">
            Fee allocation
          </Link>
        </div>
      </div>
    </Layout>
  );
}