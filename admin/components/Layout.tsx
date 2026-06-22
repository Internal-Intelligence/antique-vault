import { ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import { WalletButton } from "./WalletButton";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Head>
        <title>NFTBAY Admin — E-Waste Quantum Vault</title>
        <meta name="description" content="Admin intake for tokenized physical e-waste &lt;15lbs. Quantum intelligence flows." />
      </Head>
      <div className="min-h-screen bg-[#0f0f0f] text-white">
        <nav className="border-b border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-emerald-400 font-bold text-lg tracking-wide">
              E-WASTE QUANTUM
            </Link>
            <div className="flex gap-6 text-sm">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                Inventory
              </Link>
              <Link href="/intake" className="text-gray-400 hover:text-white transition-colors">
                Intake Item
              </Link>
              <Link href="/redemptions" className="text-gray-400 hover:text-white transition-colors">
                Redemptions
              </Link>
              <Link href="/rounds" className="text-gray-400 hover:text-white transition-colors">
                Acq. Rounds
              </Link>
              <Link href="/builders" className="text-gray-400 hover:text-white transition-colors">
                Builder Collective
              </Link>
              <span className="text-emerald-400/80 text-xs self-center">• Quantum Lab on Dashboard</span>
            </div>
          </div>
          <WalletButton />
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </div>
    </>
  );
}
