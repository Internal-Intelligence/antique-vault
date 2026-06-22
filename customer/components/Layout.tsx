import { ReactNode, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { WalletButton } from "./WalletButton";
import HomeSearch from "./home/HomeSearch";
import { BrandAvatar } from "./BrandAvatar";
import { SiteNavStrip, SiteMobileTabBar, PRIMARY_NAV, SECONDARY_NAV } from "./SiteNav";

export default function Layout({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const allNav = [...PRIMARY_NAV, ...SECONDARY_NAV];

  return (
    <>
      <Head>
        <title>NFTBAY — Marketplace for Real-World Assets</title>
        <meta
          name="description"
          content="NFTBAY — shop vault-backed phones, laptops, gaming & collectibles. Buy, sell, auction & pawn with instant SOL payouts. 5% fees. Built for crypto and everyone."
        />
      </Head>
      <div className="app-shell min-h-screen text-white pb-16 md:pb-0">
        <header className="site-header site-header--glass sticky top-0 z-40">
          <div className={`${wide ? "max-w-[1280px]" : "max-w-6xl"} mx-auto px-4 sm:px-6`}>
            <div className="h-14 flex items-center justify-between gap-3">
              <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
                <BrandAvatar size={34} title="NFTBAY home" className="brand-avatar--logo" />
                <span className="brand-wordmark group-hover:text-emerald-300 transition-colors hidden sm:inline">
                  NFTBAY
                </span>
              </Link>

              {router.pathname !== "/" && (
                <div className="hidden lg:flex flex-1 max-w-sm mx-4 min-w-0">
                  <HomeSearch compact glass />
                </div>
              )}

              <div className="flex items-center gap-2 shrink-0">
                <BrandAvatar
                  size={36}
                  href="/profile"
                  active={router.pathname === "/profile"}
                  title="Your NFTBAY profile"
                  className="hidden sm:inline-flex"
                />
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

            <SiteNavStrip />
          </div>

          {menuOpen && (
            <nav className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1">
              {allNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-link-mobile"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/profile"
                className="nav-link-mobile flex items-center gap-2.5"
                onClick={() => setMenuOpen(false)}
              >
                <BrandAvatar size={28} title="Profile" />
                Profile
              </Link>
            </nav>
          )}
        </header>

        <main className={`mx-auto px-4 sm:px-6 py-8 sm:py-12 ${wide ? "layout-main--wide" : "max-w-6xl"}`}>
          {children}
        </main>

        <footer className="border-t border-white/[0.06] mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-zinc-500">
            <span>© NFTBAY — The crypto marketplace for physical goods</span>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
              <Link href="/" className="hover:text-zinc-300 transition-colors">Hub</Link>
              <Link href="/auctions" className="hover:text-amber-300/90 transition-colors">Auctions</Link>
              <Link href="/market" className="hover:text-zinc-300 transition-colors">Market</Link>
              <Link href="/sell" className="hover:text-zinc-300 transition-colors">Sell</Link>
              <Link href="/mission" className="hover:text-zinc-300 transition-colors">Mission</Link>
              <Link href="/warehouse" className="hover:text-zinc-300 transition-colors">Warehouse</Link>
              <Link href="/fees" className="hover:text-zinc-300 transition-colors">Fees</Link>
            </div>
          </div>
        </footer>

        <SiteMobileTabBar />
      </div>
    </>
  );
}