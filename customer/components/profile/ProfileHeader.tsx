import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { BrandAvatar } from "../BrandAvatar";

interface ProfileHeaderProps {
  level: number;
  sellerTier: string;
  totalEarned: number;
  vaultValueCents: number;
  itemCount: number;
  inCustody: number;
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
  inCustody,
  listingsActive,
  onShare,
}: ProfileHeaderProps) {
  const wallet = useWallet();
  const connected = wallet.connected && wallet.publicKey;
  const handle = connected ? shortenAddress(wallet.publicKey!.toBase58()) : "guest";

  return (
    <header className="profile-hero">
      <div className="profile-hero__main">
        {connected ? (
          <div className="profile-avatar profile-avatar--user" aria-hidden>
            {handle.slice(0, 2).toUpperCase()}
          </div>
        ) : (
          <BrandAvatar size={48} title="NFTBAY profile" className="profile-avatar--brand" />
        )}
        <div className="min-w-0 flex-1">
          <p className="profile-hero__eyebrow">Your vault</p>
          <h1 className="profile-hero__title">
            {connected ? handle : "Profile"}
          </h1>
          <p className="profile-hero__meta">
            {connected ? (
              <>
                <span className="profile-tier">{sellerTier}</span>
                <span className="profile-dot">·</span>
                <span>Level {level}</span>
                {inCustody > 0 && (
                  <>
                    <span className="profile-dot">·</span>
                    <span>{inCustody} in warehouse custody</span>
                  </>
                )}
              </>
            ) : (
              "Connect wallet to see inventory, custody status, and payouts"
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
          <span className="profile-stat__label">Inventory value</span>
          <span className="profile-stat__value">
            ${(vaultValueCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat__label">In custody</span>
          <span className="profile-stat__value">{inCustody}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat__label">Listed</span>
          <span className="profile-stat__value">{listingsActive}</span>
        </div>
        <div className="profile-stat profile-stat--accent">
          <span className="profile-stat__label">Lifetime earned</span>
          <span className="profile-stat__value text-emerald-400">
            ${totalEarned.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </header>
  );
}