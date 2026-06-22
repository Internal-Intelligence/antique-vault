export type RecentSale = {
  id: string;
  name: string;
  category: string;
  soldFor: number;
  ago: string;
  buyer: string;
  icon: string;
};

export const RECENT_SALES: RecentSale[] = [
  { id: "RS1", name: "iPhone 14 Pro 128GB", category: "Smartphones", soldFor: 612, ago: "4m ago", buyer: "maya.sol", icon: "📱" },
  { id: "RS2", name: "MacBook Pro M1 16\"", category: "Laptops", soldFor: 899, ago: "11m ago", buyer: "vault_buyer", icon: "💻" },
  { id: "RS3", name: "PS5 Digital Edition", category: "Gaming", soldFor: 385, ago: "18m ago", buyer: "gameon.eth", icon: "🎮" },
  { id: "RS4", name: "AirPods Pro 2", category: "Audio", soldFor: 142, ago: "22m ago", buyer: "audio_fan", icon: "🎧" },
  { id: "RS5", name: "Canon EOS R10 Body", category: "Cameras", soldFor: 528, ago: "31m ago", buyer: "shutter.sol", icon: "📷" },
  { id: "RS6", name: "Apple Watch Series 9", category: "Wearables", soldFor: 278, ago: "38m ago", buyer: "fit_track", icon: "⌚" },
];

export type AuctionPreview = {
  id: string;
  name: string;
  highBid: number;
  bids: number;
  endsIn: string;
};

export const AUCTION_PREVIEWS: AuctionPreview[] = [
  { id: "AP1", name: "Steam Deck OLED 1TB", highBid: 489, bids: 12, endsIn: "2h 08m" },
  { id: "AP2", name: "DJI Mini 4 Pro Fly More", highBid: 412, bids: 7, endsIn: "4h 22m" },
  { id: "AP3", name: "Vintage Seiko 6139 Pogue", highBid: 318, bids: 19, endsIn: "38m" },
];