import { useEffect, useState } from "react";

export default function Countdown({ endTime }: { endTime: number }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, endTime - now);
  if (remaining <= 0) return <span className="text-zinc-500">Ended</span>;

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const urgent = remaining < 3600;

  return (
    <span className={urgent ? "text-amber-400 font-medium" : "text-emerald-400"}>
      {h > 0 ? `${h}h ` : ""}
      {m}m {s}s
    </span>
  );
}