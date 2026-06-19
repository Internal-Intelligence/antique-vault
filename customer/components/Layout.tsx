import { ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import { WalletButton } from "./WalletButton";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Head>
        <title>The Vault — Collectibles</title>
        <meta name="description" content="Own tokenized antiques. Redeem, store, or sell." />
      </Head>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between backdrop-blur-sm sticky top-0 z-40 bg-[#0a0a0a]/90">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-lg tracking-widest">THE VAULT</span>
            <span className="text-gray-600 text-xs hidden sm:block">Tokenized Antiques</span>
          </Link>
          <div className="hidden sm:flex gap-6 text-sm">
            <Link href="/market" className="text-gray-500 hover:text-white transition-colors">Market</Link>
            <Link href="/acquire" className="text-gray-500 hover:text-white transition-colors">Acquire</Link>
            <Link href="/" className="text-gray-500 hover:text-white transition-colors">My Items</Link>
          </div>
          <WalletButton />
        </nav>
        <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
      </div>
    </>
  );
}
