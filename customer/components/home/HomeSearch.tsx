import { FormEvent, useState } from "react";
import { useRouter } from "next/router";

type Props = {
  large?: boolean;
  compact?: boolean;
  glass?: boolean;
  hub?: boolean;
};

export default function HomeSearch({ large, compact, glass, hub }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/market?q=${encodeURIComponent(term)}` : "/market");
  }

  const className = [
    "home-search",
    large && "home-search--large",
    compact && "home-search--compact",
    glass && "home-search--glass",
    hub && "home-search--hub",
    focused && "home-search--focused",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form onSubmit={submit} className={className}>
      <span className="home-search-icon" aria-hidden>
        ⌕
      </span>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={
          compact
            ? "Search NFTBAY…"
            : "Search phones, laptops, gaming, collectibles…"
        }
        className="home-search-input"
        aria-label="Search marketplace"
      />
      <button type="submit" className="home-search-btn">
        {compact ? "Go" : "Search"}
      </button>
    </form>
  );
}