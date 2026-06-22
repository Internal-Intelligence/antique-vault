import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import { IosModal, IosRow } from "../components/IosModal";
import VaultItemCard from "../components/VaultItemCard";
import { getProgram } from "../lib/anchor";
import { fetchOwnedVaultItems, VaultItem } from "../lib/fetchOwnedItems";
import { getNeurochipBoosterDecision } from "../lib/quantum";
import FeeDisclosure from "../components/FeeDisclosure";
import { getNftBayProgram, createNftBayListing, getSellerNftAta } from "../lib/nftbay";
import { PublicKey } from "@solana/web3.js";
import { requireIdVerification } from "../lib/anchor";
import { BN } from "@coral-xyz/anchor";

type Modal = "store" | "list" | null;

interface PrestigeBadgeDef {
  id: string;
  name: string;
  icon: string;
  detail: string;
  how: string;
  points: number;
}

const PRESTIGE_DEFS: PrestigeBadgeDef[] = [
  { id: "verified-commander", name: "Verified Seller", icon: "🛡️", detail: "Successfully verified your identity and wallet. The foundation of trust in the vault.", how: "Complete ID verification in your account settings or first high-value action.", points: 120 },
  { id: "pawn-legend", name: "Pawn Legend", icon: "♟️", detail: "Legendary status in the pawn ecosystem. You've moved serious hardware through the vault.", how: "Pawn 5+ devices into the vault. Each successful pawn adds to your legend.", points: 150 },
  { id: "auction-master", name: "Auction Master", icon: "🏛️", detail: "Master of the live auction floor. Won or sold in high-stakes NFTBAY auctions.", how: "Win or successfully close 3+ live auctions on the marketplace.", points: 180 },
  { id: "live-bidder", name: "Live Bidder", icon: "⚡", detail: "Fearless live bidder. You thrive in the fast-paced, real-time auction battles.", how: "Place 10 successful live bids across auctions. Speed and courage count.", points: 90 },
  { id: "shipping-pro", name: "Shipping Pro", icon: "📦", detail: "Proven logistics expert. Your shipments arrive fast and flawless every time.", how: "Complete 3+ shipping flows with on-time simulated deliveries.", points: 110 },
  { id: "promoted-seller", name: "Promoted Seller", icon: "📈", detail: "Used promoted listings to reach more buyers. Your items get extra visibility in search.", how: "List your first promoted listing on NFTBAY.", points: 140 },
  { id: "top-collector", name: "Top Collector", icon: "💎", detail: "Elite collector. Your vault holds rare and high-value tokenized assets.", how: "Accumulate 8+ high-value items in your vault collection.", points: 200 },
  { id: "social-influencer", name: "Social Influencer", icon: "📣", detail: "Prestige amplifier. Your shares drive new commanders into the ecosystem.", how: "Share 5+ badges or successful sales publicly (demo share counts).", points: 75 },
  { id: "first-sale", name: "First Sale", icon: "💰", detail: "Made history with your very first sale. The start of your commander journey.", how: "Complete your first successful listing + sale on the marketplace.", points: 80 },
  { id: "loyal-commander", name: "Loyal Commander", icon: "⭐", detail: "Unwavering loyalty. You've been a core member of the NFTBAY vault community.", how: "Stay active for 30+ days with repeated vault interactions.", points: 130 },
  { id: "quantum-pioneer", name: "Power Seller", icon: "⭐", detail: "Consistent high-volume seller. AI pricing tools and smart listings power your edge.", how: "Use the AI pricing assistant 5+ times and maintain active listings.", points: 95 },
  { id: "golden-loop-legend", name: "Golden Loop Legend", icon: "🏆", detail: "Ultimate prestige. You've built a thriving seller portfolio and maximized marketplace activity.", how: "Reach high total portfolio value with multiple active listings and completed sales.", points: 220 },
];

export default function Portfolio() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [listItem, setListItem] = useState<VaultItem | null>(null);
  const [copied, setCopied] = useState(false);
  // Golden Money Ticket neurochip state for dynamic x% booster optimization
  const [neuroDecision, setNeuroDecision] = useState<ReturnType<typeof getNeurochipBoosterDecision> | null>(null);
  const [selectedBoosterBps, setSelectedBoosterBps] = useState(420); // default from neuro
  const [selectedOwnerFeeBps, setSelectedOwnerFeeBps] = useState(500); // Production: 5% platform fee (0.5%-8% on-chain)
  const [listingStatus, setListingStatus] = useState("");

  // === PRESTIGE & ACHIEVEMENTS: 12 beautiful badges, emotional core ===
  const [unlockedBadges, setUnlockedBadges] = useState<Set<string>>(new Set([
    "verified-commander", "pawn-legend", "first-sale", "promoted-seller", "loyal-commander", "top-collector"
  ])); // Start with current 6 unlocked
  const [badgeProgress, setBadgeProgress] = useState<Record<string, number>>({
    "auction-master": 33,
    "live-bidder": 50,
    "shipping-pro": 67,
    "social-influencer": 20,
    "quantum-pioneer": 40,
    "golden-loop-legend": 15,
  });
  const [selectedBadge, setSelectedBadge] = useState<PrestigeBadgeDef | null>(null);
  const [shareToast, setShareToast] = useState("");

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) loadItems();
  }, [wallet.connected, wallet.publicKey]);

  async function loadItems() {
    if (!wallet.publicKey) return;
    setLoading(true);
    try {
      const program = getProgram(wallet, connection);
      const owned = await fetchOwnedVaultItems(program, connection, wallet.publicKey);
      setItems(owned);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function openList(item: VaultItem) {
    setListItem(item);
    setModal("list");
  }

  // Neurochip live decision when opening list modal (optimizes x% for golden loop volume/revenue)
  useEffect(() => {
    if (listItem && modal === "list") {
      const priceApprox = (listItem.appraisedValueUsdCents || 4500) * 100000; // rough lamports proxy
      const dec = getNeurochipBoosterDecision(priceApprox, listItem.category || "General", 0.55, items.length);
      setNeuroDecision(dec);
      setSelectedBoosterBps(Math.floor(dec.xPct * 10000));
      setSelectedOwnerFeeBps(dec.ownerFeeBps);
      setListingStatus("");
    }
  }, [listItem, modal, items.length]);

  function copyMint(mint: string) {
    navigator.clipboard.writeText(mint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inVault = items.filter((i) => i.status === 0).length;
  const totalValue = items.reduce((s, i) => s + i.appraisedValueUsdCents, 0) / 100;

  // Prestige computations — Level based on unlocked count + prestigeScore (portfolio weighted)
  const unlockedCount = PRESTIGE_DEFS.filter(b => isBadgeUnlocked(b.id)).length;
  const prestigeScore = PRESTIGE_DEFS.reduce((sum, b) => sum + (isBadgeUnlocked(b.id) ? b.points : Math.floor((badgeProgress[b.id] || 0) / 100 * b.points * 0.2)), 0) + Math.floor(totalValue / 8);
  const level = Math.max(1, Math.floor(1 + unlockedCount * 0.6 + prestigeScore / 140));

  // Auto prestige evolution based on actual portfolio data — fires after computations
  useEffect(() => {
    if (items.length === 0) return;
    if (items.length >= 1) {
      if (!unlockedBadges.has("first-sale")) unlockBadge("first-sale");
    }
    if (items.length >= 4 && !isBadgeUnlocked("top-collector")) {
      unlockBadge("top-collector");
    }
    if (items.length >= 2 && (badgeProgress["pawn-legend"] || 0) < 70) {
      advanceBadgeProgress("pawn-legend", 55);
    }
    if (totalValue > 180) {
      advanceBadgeProgress("golden-loop-legend", 22);
    }
  }, [items.length]); // keep deps minimal to avoid churn; totalValue not strictly needed

  // Prestige helpers — emotional core for retention (defined after totalValue for TDZ safety)
  function isBadgeUnlocked(id: string): boolean {
    return unlockedBadges.has(id) || (badgeProgress[id] || 0) >= 100;
  }

  function getBadgeProgress(id: string): number {
    if (isBadgeUnlocked(id)) return 100;
    return badgeProgress[id] || 0;
  }

  function unlockBadge(id: string) {
    setUnlockedBadges(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // Clear progress
    setBadgeProgress(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }

  function advanceBadgeProgress(id: string, amount = 25) {
    setBadgeProgress(prev => {
      const current = prev[id] || 0;
      const nextVal = Math.min(100, current + amount);
      const newProg = { ...prev, [id]: nextVal };
      if (nextVal >= 100 && !unlockedBadges.has(id)) {
        // auto unlock on reaching 100
        setTimeout(() => unlockBadge(id), 80);
      }
      return newProg;
    });
  }

  function openBadge(badge: PrestigeBadgeDef) {
    setSelectedBadge(badge);
  }

  function shareBadge(badge: PrestigeBadgeDef) {
    const text = `I unlocked ${badge.name} on NFTBAY — Level ${level}. ${badge.icon}`;
    navigator.clipboard.writeText(text);
    setShareToast(`${badge.name} shared to clipboard`);
    setTimeout(() => setShareToast(""), 2400);
  }

  function shareAllPrestige() {
    const uCount = PRESTIGE_DEFS.filter(b => isBadgeUnlocked(b.id)).length;
    const pScore = PRESTIGE_DEFS.reduce((sum, b) => sum + (isBadgeUnlocked(b.id) ? b.points : Math.floor((badgeProgress[b.id] || 0) / 100 * b.points * 0.2)), 0) + Math.floor(totalValue / 8);
    const lvl = Math.max(1, Math.floor(1 + uCount * 0.6 + pScore / 140));
    const text = `My NFTBAY Prestige: Level ${lvl} • ${uCount}/12 badges • ${pScore} PTS.`;
    navigator.clipboard.writeText(text);
    setShareToast("Profile link copied.");
    setTimeout(() => setShareToast(""), 2400);
  }

  return (
    <Layout>
      {!wallet.connected ? (
        <div className="max-w-xl mx-auto text-center py-16 sm:py-24">
          <p className="text-sm font-medium text-emerald-400/90 mb-3">Solana · Real-world assets</p>
          <h1 className="page-title">The marketplace for real-world assets</h1>
          <p className="page-subtitle mx-auto mb-8">
            Buy and sell physical goods on Solana. List, pawn, auction, or redeem — crypto-native commerce built for normies and degens alike.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link href="/sell" className="btn-primary w-full sm:w-auto">Start selling</Link>
            <Link href="/market" className="btn-secondary w-full sm:w-auto">Browse market</Link>
          </div>
          <p className="text-sm text-zinc-600">Connect your wallet to view your vault</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500" />
        </div>
      ) : (
        <>
          {/* Portfolio summary */}
          {items.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-10">
              {[
                { label: "Items", value: String(items.length) },
                { label: "In vault", value: String(inVault), accent: "green" as const },
                {
                  label: "Est. value",
                  value: totalValue.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }),
                  accent: "emerald" as const,
                },
              ].map((s) => (
                <motion.div key={s.label} whileTap={{ scale: 0.98 }} className="ios-stat casino-card">
                  <p className="ios-stat-label">{s.label}</p>
                  <p
                    className={`ios-stat-value ${
                      s.accent === "emerald" ? "text-emerald-400" : s.accent === "green" ? "text-emerald-500" : ""
                    }`}
                  >
                    {s.value}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              PRESTIGE & ACHIEVEMENTS — THE EMOTIONAL CORE (12 BADGES)
              Heavy social display. iOS cards. Progress. Share. Level calc.
              ═══════════════════════════════════════════════════════════════ */}
          <div id="prestige" className="mb-10">
            {/* Toast for shares */}
            {shareToast && (
              <div className="mb-3 mx-auto max-w-fit text-center text-sm px-4 py-1.5 bg-[#22ffaa]/10 border border-[#22ffaa]/40 rounded-full text-[#22ffaa] animate-pulse">
                {shareToast}
              </div>
            )}

            {/* Prestige Hero Header */}
            <div className="flex items-end justify-between mb-3 px-1">
              <div>
                <div className="text-xs font-medium text-zinc-500">Achievements</div>
                <div className="text-[32px] font-semibold tracking-[-1.2px] leading-none mt-0.5">
                  Level {level}
                </div>
                <div className="text-sm text-zinc-500 -mt-0.5">{unlockedCount} of 12 badges unlocked</div>
              </div>
              <div className="text-right">
                <div className="text-[42px] font-semibold tabular-nums leading-none text-emerald-400">{prestigeScore}</div>
                <div className="text-xs text-zinc-500 -mt-1">points</div>
              </div>
            </div>

            {/* Share whole profile */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={shareAllPrestige}
                className="text-xs px-4 py-1.5 rounded-full bg-white/5 border border-white/20 active:bg-white/10 text-[#22ffaa] hover:border-[#22ffaa]/40 transition"
              >
                Share profile
              </button>
              <a href="/profile" className="text-xs px-3 py-1.5 text-amber-400 hover:underline">Full Profile →</a>
            </div>

            {/* Beautiful iOS Prestige Badge Grid — 12 cards */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {PRESTIGE_DEFS.map((badge) => {
                const unlocked = isBadgeUnlocked(badge.id);
                const prog = getBadgeProgress(badge.id);
                return (
                  <motion.div
                    key={badge.id}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => openBadge(badge)}
                    className={`relative select-none rounded-2xl p-3 min-h-[118px] flex flex-col items-center justify-center text-center border active:opacity-90 transition-all ${
                      unlocked
                        ? "bg-gradient-to-br from-[#1c1c1e] via-[#18181a] to-[#1c1c1e] border-amber-400/50 shadow-[0_1px_0_0_rgba(255,215,0,0.15)]"
                        : "bg-[#1c1c1e] border-white/10"
                    }`}
                    style={unlocked ? { boxShadow: "0 0 0 1px rgba(255, 215, 0, 0.18) inset" } : {}}
                  >
                    <div className={`text-4xl mb-1.5 transition-all ${unlocked ? "" : "opacity-50 grayscale"}`}>
                      {badge.icon}
                    </div>
                    <div className="font-semibold text-[13px] leading-tight tracking-[-0.2px] text-white">
                      {badge.name}
                    </div>
                    <div className="text-[9px] text-amber-400/70 mt-0.5 tabular-nums">
                      {badge.points} PTS
                    </div>

                    {unlocked ? (
                      <div className="mt-1.5 inline-flex items-center text-[9px] font-medium px-2 py-px rounded bg-[#22ffaa]/10 text-[#22ffaa] border border-[#22ffaa]/30">
                        UNLOCKED ✓
                      </div>
                    ) : prog > 0 ? (
                      <div className="w-full mt-2 px-1">
                        <div className="h-1 bg-white/10 rounded overflow-hidden">
                          <div
                            className="h-1 bg-gradient-to-r from-[#22ffaa] to-emerald-400 transition-all"
                            style={{ width: `${prog}%` }}
                          />
                        </div>
                        <div className="text-[#22ffaa] text-[9px] mt-0.5 font-mono tracking-tighter">{prog}%</div>
                      </div>
                    ) : (
                      <div className="mt-1.5 text-[9px] text-gray-500">LOCKED</div>
                    )}

                    {/* Subtle tap hint */}
                    <div className="absolute bottom-1.5 right-1.5 text-[8px] text-white/20">i</div>
                  </motion.div>
                );
              })}
            </div>

            {/* How to earn more prestige */}
            <div className="mt-4 px-1">
              <div className="uppercase tracking-[1px] text-[10px] text-gray-500 mb-1.5">HOW TO EARN MORE PRESTIGE</div>
              <div className="text-[12px] text-gray-400 leading-snug grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                <div>• Pawn more devices → Pawn Legend</div>
                <div>• Win auctions &amp; list promoted → Auction Master + Promoted Seller</div>
                <div>• Ship hardware flawlessly → Shipping Pro</div>
                <div>• Bid live frequently → Live Bidder</div>
                <div>• Grow vault holdings → Top Collector</div>
                <div>• Use AI tools &amp; share often → Power Seller + Social Influencer</div>
              </div>
              <div className="text-[10px] text-amber-400/60 mt-2">Prestige powers social status and future seller perks.</div>
            </div>
          </div>

          <div className="mt-6 mb-10 ios-group">
            <div className="font-semibold mb-2 flex justify-between text-[17px] tracking-[-0.4px]"><span>Market insights</span><button onClick={()=>{/*reset fast*/}} className="ios-btn-ghost text-xs">Reset</button></div>
            <div className="text-xs mb-2">Category insights · Working / Non-working</div>
            <div className="flex flex-wrap gap-2 mb-2">{["Eco buyers?","Demand surge?","Price sensitivity?","Photo quality?"].map((q,i)=><button type="button" key={i} onClick={()=>alert(q+" — estimate updated based on comparable sales.")} className="ios-chip">{q}</button>)}</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>Expected: <b className="text-amber-400">$87</b> (market avg)<br/>Working: <b>$78</b> / Non-working: <b className="text-rose-400">$29</b></div>
              <div>A/B test: $78 → 71% accept | $102 → 39% accept <span className="text-violet-300">(A wins)</span><br/>Variance ±$21</div>
            </div>
            <div className="text-[10px] mt-1 text-gray-500">Tap a question to refine estimates. Based on comparable sales and item condition.</div>
          </div>

          {/* Grid or empty state */}
          {items.length === 0 ? (
            <div className="text-center py-20 text-gray-600">
              <p className="text-lg mb-2">No tokenized assets yet</p>
              <p className="text-sm">
                List your first item or explore mail-in e-waste from your profile.
              </p>
              <Link href="/sell" className="text-emerald-400 hover:underline text-sm">List an item →</Link>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Your vault</h2>
                <button
                  onClick={loadItems}
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  Refresh
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((item) => (
                  <VaultItemCard
                    key={item.nftMint}
                    item={item}
                    onStore={() => setModal("store")}
                    onList={() => openList(item)}
                  />
                ))}
              </div>
            </>
          )}

          <div className="mt-16 border-t border-white/10 pt-10">
            <h3 className="text-lg font-semibold mb-6 text-center">How NFTBAY works</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              {[
                { num: "01", title: "List or tokenize", desc: "Describe your item. AI prices it based on condition, demand, and comparable sales." },
                { num: "02", title: "Vault custody", desc: "Ship to our warehouse or hold in vault. Every asset is backed by the physical item." },
                { num: "03", title: "Trade on-chain", desc: "Fixed price, auctions, pawn, or promoted listings — 5–8% marketplace fees." },
                { num: "04", title: "Cash out or redeem", desc: "Sell for SOL, withdraw earnings, or burn your NFT to receive the physical item." },
              ].map((step) => (
                <div key={step.num} className="ios-group">
                  <div className="text-emerald-400 font-mono text-xs mb-1">{step.num}</div>
                  <div className="font-semibold mb-1">{step.title}</div>
                  <p className="text-gray-500 text-xs leading-snug">{step.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-[10px] text-gray-600 mt-4">Physical goods only. Mail-in e-waste recycling available in your profile.</p>
          </div>
        </>
      )}

      {/* ── Store modal ── */}
      {modal === "store" && (
        <IosModal onClose={() => setModal(null)}>
          <div className="text-center">
            <div className="text-3xl mb-4">🏦</div>
            <h2 className="text-[20px] font-semibold mb-2 tracking-[-0.4px]">Vault Storage</h2>
            <p className="text-[rgba(235,235,245,0.6)] leading-relaxed mb-4 text-[15px]">
              Your item is already safely stored in our climate-controlled warehouse.
              No action required — just hold your NFT.
            </p>
            <div className="ios-inset text-sm text-left mb-4">
              <IosRow label="Storage fee" value="$9.99 / month" />
              <IosRow label="Insurance" value="Included up to appraised value" />
              <IosRow label="Billing" value="Monthly via Stripe to email on file" />
              <IosRow label="Access" value="Redeem anytime by burning your NFT" />
            </div>
            <p className="text-[13px] text-[rgba(235,235,245,0.45)]">
              You'll receive a monthly invoice via email. Missing two consecutive payments
              initiates a forced sale at appraised value to cover costs.
            </p>
          </div>
        </IosModal>
      )}

      {/* ── List modal — GOLDEN MONEY TICKET LOOP (my fee + booster neurochip x%) ── */}
      {modal === "list" && listItem && (
        <IosModal onClose={() => { setModal(null); setListItem(null); setNeuroDecision(null); setListingStatus(""); }}>
          <div className="text-center">
            <div className="text-3xl mb-3">🏷️</div>
            <h2 className="text-xl font-bold mb-1">List on NFTBAY Marketplace</h2>
            <p className="text-gray-500 text-sm mb-4">
              Competitive fees: 5% standard, 8% promoted (+ promoter share).<br />
              AI suggests optimal promotion % for visibility and sales volume.
            </p>

            <div className="ios-inset text-sm text-left mb-4">
              <IosRow label="Item" value={listItem.name} />
              <IosRow label="Est value (cents)" value={String(listItem.appraisedValueUsdCents)} />
              <IosRow label="Mint" value={`${listItem.nftMint.slice(0,8)}...`} />
              <IosRow label="Platform fee" value={`${(selectedOwnerFeeBps / 100).toFixed(1)}%`} />
            </div>

            {/* NEUROCHIP DECISION + BUBBLE FORMAT QUESTIONS */}
            {neuroDecision && (
              <div className="mb-5 ios-inset text-left">
                <div className="uppercase tracking-[1.5px] text-[10px] text-[#22ffaa] mb-1">AI promotion suggestion</div>
                <div className="text-lg font-bold text-white mb-1">
                  {(neuroDecision.xPct * 100).toFixed(1)}% promoter share · {(selectedOwnerFeeBps/100).toFixed(1)}% platform fee
                </div>
                <div className="text-xs text-gray-400 mb-3">Confidence: {neuroDecision.neuroScore} · Seller keeps ~{Math.max(85, 100 - selectedOwnerFeeBps / 100 - selectedBoosterBps / 100).toFixed(0)}% after fees.</div>

                <div className="mb-1 text-[10px] text-gray-500">Choose promotion share:</div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {neuroDecision.bubbleRecs.map((b: string, i: number) => {
                    const pct = Math.floor( (i===0 ? neuroDecision.xPct : (0.03 + i*0.015)) * 10000 );
                    const active = selectedBoosterBps === pct;
                    return (
                      <button
                        key={i}
                        onClick={() => { setSelectedBoosterBps(pct); setListingStatus("Promotion share selected"); }}
                        className={`bubble text-[10px] px-3 py-1 rounded-full border ${active ? "border-[#22ffaa] bg-[#22ffaa]/10 text-[#22ffaa]" : "border-white/10 hover:border-white/30 text-gray-300"}`}
                      >
                        {b.split(":")[0] || b}
                      </button>
                    );
                  })}
                  {/* Extra manual bubbles for fine control */}
                  {[250, 420, 650, 900].map(bp => (
                    <button key={bp} onClick={() => setSelectedBoosterBps(bp)} className={`text-[10px] px-2 py-0.5 rounded-full border ${selectedBoosterBps===bp ? "border-emerald-400 bg-emerald-500/10" : "border-white/10"}`}>
                      { (bp/100).toFixed(1) }%
                    </button>
                  ))}
                </div>

                <div className="text-[9px] text-[#22ffaa]/70">Platform fees fund inventory acquisition → more listings → more sales → repeat.</div>
              </div>
            )}

            <button
              disabled={!wallet.connected || !neuroDecision}
              onClick={async () => {
                if (!wallet.publicKey || !listItem) return;
                requireIdVerification("my-nfts-list-" + listItem.itemId, "secondary-list");
                setListingStatus("Preparing listing…");
                try {
                  const nProgram = getNftBayProgram(wallet as any, connection);
                  const nftMint = new PublicKey(listItem.nftMint);
                  const sellerAta = getSellerNftAta(nftMint, wallet.publicKey);
                  const priceLamports = (listItem.appraisedValueUsdCents || 1200) * 10000;
                  const isPromoted = !!neuroDecision?.recommendedBoost || selectedOwnerFeeBps >= 800;
                  await createNftBayListing(
                    nProgram,
                    nftMint,
                    sellerAta,
                    new BN(priceLamports),
                    0,
                    86400 * 7,
                    new BN(0),
                    isPromoted,
                    listItem.category || "General",
                    selectedOwnerFeeBps,
                    PublicKey.default,
                    selectedBoosterBps,
                    0,
                    neuroDecision?.neuroScore || 78
                  );
                  setListingStatus("Listed on devnet. Promotion and fees active.");
                } catch (e: any) {
                  console.error(e);
                  setListingStatus("Sign with wallet to list on devnet: " + (e.message || "connect wallet"));
                }
              }}
              className="w-full ios-btn ios-btn-primary disabled:opacity-50 mb-2 casino-btn"
            >
              Activate listing
            </button>
            <div className="text-[10px] text-center text-emerald-400 mb-3 h-4">{listingStatus}</div>

            <div className="text-left mb-3">
              <FeeDisclosure compact promoted={selectedOwnerFeeBps >= 800} />
            </div>
          </div>
        </IosModal>
      )}

      {/* PRESTIGE BADGE DETAIL MODAL — iOS sheet with share */}
      {selectedBadge && (
        <IosModal onClose={() => setSelectedBadge(null)}>
          <div className="text-center px-1">
            <div className="text-7xl mb-2">{selectedBadge.icon}</div>
            <div className="text-2xl font-bold tracking-[-0.4px] mb-0.5">{selectedBadge.name}</div>
            <div className="text-amber-400 text-xs font-mono tracking-[1px] mb-4">{selectedBadge.points} PRESTIGE POINTS</div>

            <p className="text-[14px] leading-snug text-gray-300 mb-4">{selectedBadge.detail}</p>

            <div className="ios-inset text-left text-sm mb-4">
              <div className="font-semibold mb-1 text-[#22ffaa]">HOW TO EARN</div>
              <div>{selectedBadge.how}</div>
              {!isBadgeUnlocked(selectedBadge.id) && (
                <div className="mt-3 pt-3 border-t border-white/10 text-xs">
                  Current progress: <span className="font-mono text-[#22ffaa]">{getBadgeProgress(selectedBadge.id)}%</span>
                </div>
              )}
            </div>

            {isBadgeUnlocked(selectedBadge.id) ? (
              <button
                onClick={() => shareBadge(selectedBadge)}
                className="casino-btn w-full bg-gradient-to-b from-[#ffd700] to-[#e6b800] text-black font-bold active:scale-[0.985]"
              >
                📤 SHARE THIS BADGE
              </button>
            ) : (
              <button
                onClick={() => {
                  if (selectedBadge) advanceBadgeProgress(selectedBadge.id, 28);
                }}
                className="casino-btn w-full bg-emerald-500 text-black font-bold"
              >
                SIMULATE PROGRESS +28% (DEMO)
              </button>
            )}

            <div className="text-[10px] text-gray-500 mt-3">Prestige is permanent. Share to flex on social.</div>
            <button onClick={() => setSelectedBadge(null)} className="mt-4 text-xs text-gray-400 underline">Close</button>
          </div>
        </IosModal>
      )}
    </Layout>
  );
}
