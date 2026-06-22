import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getProgram } from "../lib/anchor";
import { fetchOwnedVaultItems, VaultItem } from "../lib/fetchOwnedItems";
import {
  ProfileHeader,
  ProfileNav,
  ProfileOverview,
  ProfileInventory,
  ProfileEarn,
  ProfileExpand,
  ProfileAchievementsModal,
  ProfileEwasteMailinModal,
  PRESTIGE_DEFS,
  INCOME_AVENUES,
  buildDemoActivity,
  parseProfileTab,
  type ProfileTab,
  type EarningsSnapshot,
  type PrestigeBadgeDef,
  type IncomeAvenue,
  type ProfileNextAction,
} from "../components/profile";

const DEMO_INVENTORY: VaultItem[] = [
  { pda: null as any, itemId: "DEMO-001", name: "MacBook Pro 2019", nftMint: "demo1", condition: 0, appraisedValueUsdCents: 24500, status: 0, mintedAt: Date.now(), shippingAddress: "", category: "Laptops" },
  { pda: null as any, itemId: "DEMO-017", name: "iPhone 14 Pro", nftMint: "demo2", condition: 1, appraisedValueUsdCents: 8900, status: 0, mintedAt: Date.now(), shippingAddress: "", category: "Smartphones" },
  { pda: null as any, itemId: "DEMO-042", name: "Sony WH-1000XM5", nftMint: "demo3", condition: 0, appraisedValueUsdCents: 3200, status: 0, mintedAt: Date.now(), shippingAddress: "", category: "Headphones & Audio" },
];

export default function Profile() {
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();

  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [expandedAvenue, setExpandedAvenue] = useState<string | null>(null);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [unlockedBadges, setUnlockedBadges] = useState<Set<string>>(
    new Set(["verified-commander", "pawn-legend", "first-sale", "promoted-seller", "loyal-commander", "top-collector"])
  );
  const [badgeProgress, setBadgeProgress] = useState<Record<string, number>>({
    "auction-master": 33,
    "live-bidder": 50,
    "shipping-pro": 67,
    "social-influencer": 20,
    "quantum-pioneer": 40,
    "golden-loop-legend": 15,
  });
  const [selectedBadge, setSelectedBadge] = useState<PrestigeBadgeDef | null>(null);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [showEwasteMailin, setShowEwasteMailin] = useState(false);

  const connected = wallet.connected && !!wallet.publicKey;
  const displayItems = connected && items.length > 0 ? items : connected ? [] : DEMO_INVENTORY;
  const vaultValueCents = displayItems.reduce((s, i) => s + (i.appraisedValueUsdCents || 0), 0);
  const listingsActive = displayItems.filter((i) => i.status === 1).length;

  function isBadgeUnlocked(id: string): boolean {
    return unlockedBadges.has(id) || (badgeProgress[id] || 0) >= 100;
  }

  function getBadgeProgress(id: string): number {
    if (isBadgeUnlocked(id)) return 100;
    return badgeProgress[id] || 0;
  }

  const unlockedCount = PRESTIGE_DEFS.filter((b) => isBadgeUnlocked(b.id)).length;
  const prestigeScore =
    PRESTIGE_DEFS.reduce(
      (sum, b) =>
        sum + (isBadgeUnlocked(b.id) ? b.points : Math.floor(((badgeProgress[b.id] || 0) / 100) * b.points * 0.2)),
      0
    ) + 124;
  const level = Math.max(1, Math.floor(1 + unlockedCount * 0.6 + prestigeScore / 140));

  const sellerTier =
    level >= 8 ? "Power Seller" : level >= 5 ? "Trusted Seller" : level >= 3 ? "Active Seller" : "New Seller";

  const earnings: EarningsSnapshot = useMemo(() => {
    const base = vaultValueCents / 100;
    return {
      totalEarned: Math.max(0, base * 0.34 + unlockedCount * 42),
      pendingPayout: Math.max(0, base * 0.08 + listingsActive * 12),
      feesPaid: Math.max(0, base * 0.02),
      boostRevenue: unlockedBadges.has("promoted-seller") ? 48.5 : 0,
      affiliateShare: unlockedBadges.has("social-influencer") ? 22 : 12.4,
      shopRevenue: 0,
    };
  }, [vaultValueCents, unlockedCount, listingsActive, unlockedBadges]);

  const activities = useMemo(
    () => buildDemoActivity(displayItems.length, vaultValueCents),
    [displayItems.length, vaultValueCents]
  );

  const openWalletConnect = useCallback(() => {
    setWalletModalVisible(true);
  }, [setWalletModalVisible]);

  const nextAction = useMemo((): ProfileNextAction => {
    if (!connected) {
      return {
        title: "Connect your wallet",
        desc: "Sync vault inventory, earnings, and seller tools in one place.",
        href: "/profile",
        cta: "Connect wallet",
        onClick: openWalletConnect,
      };
    }
    if (displayItems.length === 0) {
      return {
        title: "Tokenize your first device",
        desc: "Instant AI valuation, ship to vault, receive your NFT.",
        href: "/sell",
        cta: "Sell now",
      };
    }
    if (listingsActive === 0) {
      return {
        title: "List an item on the market",
        desc: "Your vault has assets ready. List one to start earning — 5% standard fee.",
        href: "/?action=list",
        cta: "List now",
      };
    }
    return {
      title: "Boost your top listing",
      desc: "Promoted listings get 8% fee but higher visibility. Paid boost from $9.",
      href: "/?action=list&boost=1",
      cta: "Boost listing",
    };
  }, [connected, displayItems.length, listingsActive, openWalletConnect]);

  const setProfileTab = useCallback(
    (tab: ProfileTab) => {
      setActiveTab(tab);
      const query = tab === "overview" ? {} : { tab };
      router.replace({ pathname: "/profile", query }, undefined, { shallow: true });
    },
    [router]
  );

  useEffect(() => {
    if (!router.isReady) return;

    const tab = parseProfileTab(router.query.tab);
    if (tab) setActiveTab(tab);

    const avenue = Array.isArray(router.query.avenue) ? router.query.avenue[0] : router.query.avenue;
    if (avenue) {
      setActiveTab("expand");
      setExpandedAvenue(avenue);
      if (avenue === "ewaste-mailin") setShowEwasteMailin(true);
    }
  }, [router.isReady, router.query.tab, router.query.avenue]);

  const topBadges = PRESTIGE_DEFS.filter((b) => isBadgeUnlocked(b.id)).slice(0, 4);
  const fallbackBadges = topBadges.length >= 4 ? topBadges : [...topBadges, ...PRESTIGE_DEFS.filter((b) => !isBadgeUnlocked(b.id))].slice(0, 4);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) loadInventory();
  }, [wallet.connected, wallet.publicKey]);

  function showToast(msg: string, ms = 2400) {
    setToast(msg);
    setTimeout(() => setToast(""), ms);
  }

  async function loadInventory() {
    if (!wallet.publicKey) return;
    setInvLoading(true);
    try {
      const program = getProgram(wallet, connection);
      const owned = await fetchOwnedVaultItems(program, connection, wallet.publicKey);
      setItems(owned);
    } catch (e) {
      console.error("Inventory load failed:", e);
    } finally {
      setInvLoading(false);
    }
  }

  function unlockBadge(id: string) {
    setUnlockedBadges((prev) => new Set([...Array.from(prev), id]));
    setBadgeProgress((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }

  function advanceBadgeProgress(id: string, amount = 25) {
    setBadgeProgress((prev) => {
      const current = prev[id] || 0;
      const nextVal = Math.min(100, current + amount);
      if (nextVal >= 100 && !unlockedBadges.has(id)) setTimeout(() => unlockBadge(id), 60);
      return { ...prev, [id]: nextVal };
    });
  }

  function shareProfile() {
    const text = `My NFTBAY seller profile — Level ${level} · $${(vaultValueCents / 100).toLocaleString()} vault · ${displayItems.length} items. #NFTBAY`;
    navigator.clipboard.writeText(text);
    showToast("Profile copied to clipboard");
  }

  function shareBadge(badge: PrestigeBadgeDef) {
    navigator.clipboard.writeText(`I earned ${badge.name} on NFTBAY — Level ${level}. #NFTBAY`);
    showToast(`${badge.name} copied to share`);
  }

  function handlePawn(item: VaultItem) {
    showToast(`Pawn flow queued for ${item.name}`);
    if (items.length > 0) {
      setItems((prev) => prev.map((i) => (i.nftMint === item.nftMint ? { ...i, status: 2 } : i)));
    }
  }

  function handleList(item: VaultItem) {
    router.push("/");
    showToast(`Opening vault to list ${item.name}`);
  }

  function handleRedeem(item: VaultItem) {
    if (item.nftMint && !item.nftMint.startsWith("demo")) {
      router.push(`/redeem/${item.nftMint}`);
    } else {
      showToast(`Redeem flow started for ${item.name}`);
    }
  }

  function handleWithdraw() {
    showToast("Withdrawal queued to connected wallet (demo)");
  }

  function handleAvenueAction(avenue: IncomeAvenue) {
    if (avenue.id === "affiliate") {
      const refId = wallet.publicKey?.toBase58().slice(0, 8) || `demo-${level}`;
      const origin = typeof window !== "undefined" ? window.location.origin : "https://nftbay.app";
      const link = `${origin}/ref/${refId}`;
      navigator.clipboard.writeText(link);
      showToast(`Affiliate link copied — ${link}`);
      return;
    }
    if (avenue.id === "shop") {
      showToast("You're on the shop waitlist — we'll notify you when storefronts open");
      return;
    }
    if (avenue.id === "ewaste-mailin") {
      setShowEwasteMailin(true);
      return;
    }
    showToast(`${avenue.cta} — we'll notify you at launch`);
  }

  function closeBadgeModal() {
    if (selectedBadge) {
      setSelectedBadge(null);
    } else {
      setShowAllBadges(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {toast && <div className="profile-toast">{toast}</div>}

        <ProfileHeader
          level={level}
          sellerTier={sellerTier}
          totalEarned={earnings.totalEarned}
          vaultValueCents={vaultValueCents}
          itemCount={displayItems.length}
          listingsActive={listingsActive}
          onShare={shareProfile}
        />

        <ProfileNav active={activeTab} onChange={setProfileTab} />

        <div
          id={`profile-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`profile-tab-${activeTab}`}
        >
          {activeTab === "overview" && (
            <ProfileOverview
              activities={activities}
              nextAction={nextAction}
              topBadges={fallbackBadges}
              unlockedCount={unlockedCount}
              onOpenBadge={(b) => setSelectedBadge(b)}
              onViewAllBadges={() => setShowAllBadges(true)}
            />
          )}

          {activeTab === "inventory" && (
            <ProfileInventory
              items={displayItems}
              loading={invLoading && connected}
              connected={connected}
              onRefresh={loadInventory}
              onPawn={handlePawn}
              onList={handleList}
              onRedeem={handleRedeem}
            />
          )}

          {activeTab === "earn" && (
            <ProfileEarn earnings={earnings} onWithdraw={handleWithdraw} />
          )}

          {activeTab === "expand" && (
            <ProfileExpand
              avenues={INCOME_AVENUES}
              initialExpandedId={expandedAvenue}
              onAvenueAction={handleAvenueAction}
            />
          )}
        </div>
      </div>

      {showEwasteMailin && (
        <ProfileEwasteMailinModal onClose={() => setShowEwasteMailin(false)} />
      )}

      {(showAllBadges || selectedBadge) && (
        <ProfileAchievementsModal
          badges={PRESTIGE_DEFS}
          isUnlocked={isBadgeUnlocked}
          getProgress={getBadgeProgress}
          selected={selectedBadge}
          showAll={showAllBadges}
          onClose={closeBadgeModal}
          onSelect={(b) => {
            setShowAllBadges(false);
            setSelectedBadge(b);
          }}
          onShare={shareBadge}
          onAdvance={(id) => advanceBadgeProgress(id, 30)}
        />
      )}
    </Layout>
  );
}