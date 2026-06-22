import { useEffect, useState } from "react";

export default function Countdown({ endTime }: { endTime: number }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, endTime - now);
  if (remaining <= 0) return <span className="auction-countdown auction-countdown--ended">Ended</span>;

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  return (
    <span className="auction-countdown">
      {h > 0 ? `${h}h ` : ""}
      {m}m {s}s
    </span>
  );
}