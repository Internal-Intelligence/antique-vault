import Link from "next/link";
import { HOME_HOW_IT_WORKS } from "./data";

export default function HomeHowItWorks() {
  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <h2 className="home-section-title">How NFTBAY works</h2>
        <p className="home-section-sub mx-auto max-w-lg">
          Four steps from closet clutter to SOL in your wallet — or a verified item shipped to your door.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {HOME_HOW_IT_WORKS.map((step) => (
          <div key={step.step} className="home-step-card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{step.icon}</span>
              <span className="text-[11px] font-mono text-emerald-500/80">{step.step}</span>
            </div>
            <h3 className="font-semibold text-[16px] mb-2">{step.title}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-zinc-600 mt-6">
        Physical goods only. Optional mail-in recycling lives in your{" "}
        <Link href="/profile?tab=expand" className="text-emerald-500/90 hover:underline">
          Profile → Grow
        </Link>
        .
      </p>
    </section>
  );
}