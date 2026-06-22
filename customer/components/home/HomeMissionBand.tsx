import Link from "next/link";
import HomeSectionReveal from "./HomeSectionReveal";

export default function HomeMissionBand() {
  return (
    <HomeSectionReveal className="mb-10" variant="fadeIn" delay={0.06}>
      <div className="home-mission-band glass-panel glass-panel--subtle">
        <div className="home-mission-band-copy">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/80 mb-1">
            Where fees go
          </p>
          <h2 className="text-base font-semibold text-zinc-100">
            Deflationary deals · incentive bids · warehouse verification
          </h2>
          <p className="text-sm text-zinc-500 mt-1 leading-relaxed max-w-xl">
            Marketplace fees fund vault inventory in tech, jewelry, and cards — and a transparent bot that
            bids on standout listings. Every item verified at the NFTBAY warehouse first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link href="/mission" className="btn-secondary text-sm min-h-[40px] px-4">
            Our mission
          </Link>
          <Link href="/warehouse" className="home-ghost-btn min-h-[40px] px-2">
            Verification hub →
          </Link>
        </div>
      </div>
    </HomeSectionReveal>
  );
}