import { ReactNode, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { WalletButton } from "./WalletButton";

const NAV = [
  { href: "/sell", label: "Sell" },
  { href: "/market", label: "Market" },
  { href: "/acquire", label: "Fund" },
  { href: "/fees", label: "Fees" },
  { href: "/profile", label: "Profile" },
];

export default function Layout({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Head>
        <title>NFTBAY — Marketplace for Real-World Assets</title>
        <meta
          name="description"
          content="NFTBAY — shop vault-backed phones, laptops, gaming & collectibles. Buy, sell, auction & pawn with instant SOL payouts. 5% fees. Built for crypto and everyone."
        />
      </Head>
      <div className="app-shell min-h-screen text-white">
        <header className="site-header sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <span className="brand-mark">◆</span>
              <span className="brand-wordmark">NFTBAY</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {NAV.map((item) => {
                const active = router.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${active ? "nav-link--active" : ""}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <WalletButton />
              <button
                type="button"
                className="md:hidden nav-menu-btn"
                aria-label="Menu"
                onClick={() => setMenuOpen((o) => !o)}
              >
                {menuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>

          {menuOpen && (
            <nav className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-link-mobile"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </header>

        <main className={`mx-auto px-4 sm:px-6 py-8 sm:py-12 ${wide ? "layout-main--wide" : "max-w-6xl"}`}>{children}</main>

        <footer className="border-t border-white/[0.06] mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-zinc-500">
            <span>© NFTBAY — The crypto marketplace for physical goods</span>
            <div className="flex gap-5">
              <Link href="/market" className="hover:text-zinc-300 transition-colors">Market</Link>
              <Link href="/sell" className="hover:text-zinc-300 transition-colors">Sell</Link>
              <Link href="/fees" className="hover:text-zinc-300 transition-colors">Fees</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}