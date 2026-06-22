import { FormEvent, useState } from "react";
import { useRouter } from "next/router";

type Props = { large?: boolean };

export default function HomeSearch({ large }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/market?q=${encodeURIComponent(term)}` : "/market");
  }

  return (
    <form onSubmit={submit} className={`home-search ${large ? "home-search--large" : ""}`}>
      <span className="home-search-icon" aria-hidden>
        ⌕
      </span>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search phones, laptops, gaming, collectibles…"
        className="home-search-input"
        aria-label="Search marketplace"
      />
      <button type="submit" className="home-search-btn">
        Search
      </button>
    </form>
  );
}