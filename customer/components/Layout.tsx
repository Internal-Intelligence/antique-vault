import { ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import SiteHeader from "./SiteHeader";
import { SiteMobileTabBar } from "./SiteNav";

export default function Layout({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <>
      <Head>
        <title>NFTBAY — Marketplace for Real-World Assets</title>
        <meta
          name="description"
          content="NFTBAY — shop vault-backed phones, laptops, gaming & collectibles. Buy, sell, auction & pawn with instant SOL payouts. 5% fees. Built for crypto and everyone."
        />
      </Head>
      <div className="app-shell min-h-screen text-white pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <SiteHeader wide={wide} />

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