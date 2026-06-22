import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";

interface ProfileHeaderProps {
  level: number;
  sellerTier: string;
  totalEarned: number;
  vaultValueCents: number;
  itemCount: number;
  listingsActive: number;
  onShare: () => void;
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export default function ProfileHeader({
  level,
  sellerTier,
  totalEarned,
  vaultValueCents,
  itemCount,
  listingsActive,
  onShare,
}: ProfileHeaderProps) {
  const wallet = useWallet();
  const connected = wallet.connected && wallet.publicKey;
  const handle = connected ? shortenAddress(wallet.publicKey!.toBase58()) : "guest";

  return (
    <header className="profile-hero">
      <div className="profile-hero__main">
        <div className="profile-avatar" aria-hidden>
          {connected ? handle.slice(0, 2).toUpperCase() : "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="profile-hero__eyebrow">Seller command center</p>
          <h1 className="profile-hero__title">
            {connected ? `Seller ${handle}` : "Your profile"}
          </h1>
          <p className="profile-hero__meta">
            {connected ? (
              <>
                <span className="profile-tier">{sellerTier}</span>
                <span className="profile-dot">·</span>
                <span>Level {level}</span>
              </>
            ) : (
              "Connect wallet to sync vault, earnings, and seller tools"
            )}
          </p>
        </div>
        <div className="profile-hero__actions">
          {connected ? (
            <button type="button" onClick={onShare} className="btn-secondary text-sm px-3 py-2">
              Share
            </button>
          ) : (
            <Link href="/sell" className="btn-primary text-sm px-3 py-2">
              Start selling
            </Link>
          )}
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat__label">Vault value</span>
          <span className="profile-stat__value">
            ${(vaultValueCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat__label">Items</span>
          <span className="profile-stat__value">{itemCount}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat__label">Active listings</span>
          <span className="profile-stat__value">{listingsActive}</span>
        </div>
        <div className="profile-stat profile-stat--accent">
          <span className="profile-stat__label">Total earned</span>
          <span className="profile-stat__value text-emerald-400">
            ${totalEarned.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </header>
  );
}