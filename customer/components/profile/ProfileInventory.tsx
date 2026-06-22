import Link from "next/link";
import type { VaultItem } from "../../lib/fetchOwnedItems";

interface ProfileInventoryProps {
  items: VaultItem[];
  loading: boolean;
  connected: boolean;
  onRefresh: () => void;
  onPawn: (item: VaultItem) => void;
  onList: (item: VaultItem) => void;
  onRedeem: (item: VaultItem) => void;
}

function statusLabel(status: number): { label: string; tone: string } {
  if (status === 0) return { label: "In storage", tone: "profile-status--vault" };
  if (status === 1) return { label: "Listed", tone: "profile-status--listed" };
  if (status === 2) return { label: "Pawned", tone: "profile-status--pawned" };
  return { label: "Held", tone: "profile-status--held" };
}

export default function ProfileInventory({
  items,
  loading,
  connected,
  onRefresh,
  onPawn,
  onList,
  onRedeem,
}: ProfileInventoryProps) {
  if (loading) {
    return (
      <div className="profile-empty">
        <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-emerald-500 mx-auto mb-3" />
        <p>Syncing inventory from chain…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="profile-empty">
        <p className="profile-empty__title">No inventory yet</p>
        <p className="profile-empty__body">
          Tokenize your first device to see it here. Sell, pawn, or list from one place.
        </p>
        <Link href="/sell" className="btn-primary mt-4">
          Sell a device
        </Link>
      </div>
    );
  }

  return (
    <div className="profile-inventory">
      <div className="profile-inventory__toolbar">
        <p className="text-sm text-zinc-500">{items.length} asset{items.length !== 1 ? "s" : ""}</p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={!connected}
          className="profile-text-btn disabled:opacity-40"
        >
          Refresh
        </button>
      </div>

      <ul className="profile-inventory__list">
        {items.map((item) => {
          const status = statusLabel(item.status);
          const usd = (item.appraisedValueUsdCents / 100).toFixed(0);
          return (
            <li key={item.nftMint} className="profile-inventory__row">
              <div className="profile-inventory__main">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="profile-inventory__name">{item.name}</p>
                    <p className="profile-inventory__id">
                      {item.category || "General"} · {item.itemId.slice(0, 10)}
                    </p>
                  </div>
                  <span className={`profile-status ${status.tone}`}>{status.label}</span>
                </div>
                <p className="profile-inventory__value">${usd}</p>
              </div>
              <div className="profile-inventory__actions">
                <button type="button" onClick={() => onList(item)} className="profile-action profile-action--primary">
                  List
                </button>
                <button type="button" onClick={() => onPawn(item)} className="profile-action">
                  Pawn
                </button>
                <button type="button" onClick={() => onRedeem(item)} className="profile-action">
                  Redeem
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="profile-footnote">
        Full inventory management on your{" "}
        <Link href="/" className="text-emerald-500/90 hover:text-emerald-400">
          portfolio page
        </Link>
        . Actions here sync when wallet is connected.
      </p>
    </div>
  );
}