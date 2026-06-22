export type HomeCategory = {
  id: string;
  label: string;
  icon: string;
  gradient: string;
  query: string;
  tagline: string;
};

export const HOME_CATEGORIES: HomeCategory[] = [
  { id: "phones", label: "Smartphones", icon: "📱", gradient: "from-sky-500/20 to-blue-600/5", query: "phone", tagline: "Trade-ins & flagships" },
  { id: "laptops", label: "Laptops", icon: "💻", gradient: "from-violet-500/20 to-purple-600/5", query: "laptop", tagline: "MacBooks, gaming, work" },
  { id: "gaming", label: "Gaming", icon: "🎮", gradient: "from-fuchsia-500/20 to-pink-600/5", query: "gaming", tagline: "Consoles & handhelds" },
  { id: "audio", label: "Audio", icon: "🎧", gradient: "from-emerald-500/20 to-teal-600/5", query: "audio", tagline: "Headphones & speakers" },
  { id: "cameras", label: "Cameras", icon: "📷", gradient: "from-amber-500/20 to-orange-600/5", query: "camera", tagline: "Photo & video gear" },
  { id: "wearables", label: "Wearables", icon: "⌚", gradient: "from-cyan-500/20 to-sky-600/5", query: "watch", tagline: "Watches & fitness" },
  { id: "collectibles", label: "Collectibles", icon: "🏆", gradient: "from-yellow-500/20 to-amber-600/5", query: "collectible", tagline: "Cards, art, rare finds" },
  { id: "gear", label: "Home & gear", icon: "🔌", gradient: "from-zinc-500/20 to-zinc-600/5", query: "gear", tagline: "Tools, smart home, more" },
];

export const HOME_STATS = [
  { label: "Avg. seller keeps", value: "92%+", detail: "After standard 5% fee" },
  { label: "Settlement", value: "Instant", detail: "SOL to your wallet" },
  { label: "Custody", value: "Insured", detail: "Vault-backed every item" },
  { label: "Buyers & sellers", value: "2 audiences", detail: "Crypto-native + everyone" },
];

export const HOME_TRUST_PILLS = [
  { icon: "🔒", title: "Escrow on every sale", desc: "Funds release when the deal closes — not before." },
  { icon: "🏦", title: "Vault-backed assets", desc: "Every NFT maps to a real item in custody." },
  { icon: "⚡", title: "5% standard fees", desc: "Transparent pricing. No surprise checkout junk." },
  { icon: "🛡️", title: "Verified sellers", desc: "Reputation, badges, and dispute-ready records." },
];

export const HOME_HOW_IT_WORKS = [
  { step: "01", title: "Find or list", desc: "Search the market or snap photos — AI suggests fair pricing in seconds.", icon: "🔍" },
  { step: "02", title: "Vault custody", desc: "Ship to our warehouse or hold in vault. Physical item backs your NFT.", icon: "📦" },
  { step: "03", title: "Buy, bid, or pawn", desc: "Fixed price, live auctions, or instant pawn offers — your call.", icon: "💫" },
  { step: "04", title: "Cash out or redeem", desc: "Sell for SOL, boost earnings, or burn to receive the real thing.", icon: "✨" },
];

export type CuratedPick = {
  id: string;
  name: string;
  category: string;
  priceUsd: number;
  condition: number;
  badge?: string;
  mint: string;
};

export const CURATED_PICKS: CuratedPick[] = [
  { id: "PICK-101", name: "iPhone 15 Pro 256GB", category: "Smartphones", priceUsd: 749, condition: 4, badge: "Hot deal", mint: "curated-iphone15" },
  { id: "PICK-102", name: "MacBook Air M2", category: "Laptops", priceUsd: 689, condition: 3, badge: "Vault verified", mint: "curated-mba-m2" },
  { id: "PICK-103", name: "Sony WH-1000XM5", category: "Audio", priceUsd: 198, condition: 4, mint: "curated-xm5" },
  { id: "PICK-104", name: "Nintendo Switch OLED", category: "Gaming", priceUsd: 265, condition: 3, badge: "Ending soon", mint: "curated-switch" },
  { id: "PICK-105", name: "Canon EOS R50 Kit", category: "Cameras", priceUsd: 542, condition: 3, mint: "curated-r50" },
  { id: "PICK-106", name: "Apple Watch Ultra 2", category: "Wearables", priceUsd: 599, condition: 4, badge: "Promoted", mint: "curated-ultra2" },
];

export const LIVE_ACTIVITY = [
  { who: "alex.sol", action: "won auction", item: "RTX 4080 Founders", ago: "2m" },
  { who: "maya.eth", action: "listed", item: "iPad Pro 12.9\"", ago: "4m" },
  { who: "vault_ops", action: "confirmed shipment", item: "ThinkPad X1", ago: "6m" },
  { who: "jaydan", action: "pawned", item: "PS5 Slim", ago: "9m" },
  { who: "collector", action: "bought", item: "Leica D-Lux", ago: "11m" },
];

export const HERO_ROTATIONS = [
  "phones, laptops & collectibles",
  "vault-backed goods you can trust",
  "auctions, fixed price & instant pawn",
  "crypto payouts without the crypto headache",
];