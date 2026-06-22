import { useEffect, useState } from "react";
import { LIVE_ACTIVITY } from "./data";

export default function HomeLiveActivity() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % LIVE_ACTIVITY.length), 2800);
    return () => clearInterval(t);
  }, []);

  const current = LIVE_ACTIVITY[idx];

  return (
    <section className="mb-10">
      <div className="home-activity-ticker">
        <span className="home-pill home-pill--live shrink-0">Live</span>
        <p className="text-sm text-zinc-300 truncate">
          <span className="text-emerald-400 font-medium">{current.who}</span> {current.action}{" "}
          <span className="text-white font-medium">{current.item}</span>
          <span className="text-zinc-600 ml-2">· {current.ago} ago</span>
        </p>
      </div>
    </section>
  );
}