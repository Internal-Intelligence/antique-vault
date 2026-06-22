import { HOME_STATS, HOME_TRUST_PILLS } from "./data";

export default function HomeTrustBar() {
  return (
    <section className="mb-12">
      <div className="home-stats-row mb-8">
        {HOME_STATS.map((s) => (
          <div key={s.label} className="home-stat-chip">
            <div className="home-stat-value">{s.value}</div>
            <div className="home-stat-label">{s.label}</div>
            <div className="home-stat-detail">{s.detail}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {HOME_TRUST_PILLS.map((pill) => (
          <div key={pill.title} className="home-trust-card">
            <span className="text-2xl mb-2 block">{pill.icon}</span>
            <h3 className="font-semibold text-[15px] tracking-tight text-zinc-100">{pill.title}</h3>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{pill.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}