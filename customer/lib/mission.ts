export type FeeAllocation = {
  pct: number;
  label: string;
  desc: string;
  icon: string;
};

export const FEE_ALLOCATION: FeeAllocation[] = [
  {
    pct: 40,
    label: "Incentive bid pool",
    desc: "Platform liquidity bot places transparent bids on standout tech, jewelry, and card listings — real demand, not fake hype.",
    icon: "🤖",
  },
  {
    pct: 35,
    label: "Vault acquisition",
    desc: "Source inventory for tech deals, jewelry, trading cards, and collectibles. More supply → better prices for buyers.",
    icon: "📦",
  },
  {
    pct: 15,
    label: "Verification & warehouse",
    desc: "Intake scans, condition reports, insured custody, and chain-of-custody records at the NFTBAY warehouse hub.",
    icon: "🏦",
  },
  {
    pct: 10,
    label: "Public transparency",
    desc: "Open reporting on how fees recycle into inventory, bids, and real-world expansion — groceries and beyond.",
    icon: "🌍",
  },
];

export const MISSION_PILLARS = [
  {
    title: "Deflationary deals",
    desc: "Marketplace fees fund bulk vault acquisitions in tech, jewelry, and cards. More verified inventory on shelves means sharper prices — the opposite of scarcity FOMO.",
    icon: "📉",
  },
  {
    title: "Incentive bids",
    desc: "A fee-funded bot watches the entire app and places minimum competitive bids on popular, creative, vault-verified items. Sellers see real activity; buyers see fair market depth.",
    icon: "⚡",
  },
  {
    title: "Warehouse verification",
    desc: "Every item routes through the NFTBAY warehouse — intake scan, condition grade, paperwork hash, and on-chain custody before it ever lists.",
    icon: "🔬",
  },
  {
    title: "World-scale vision",
    desc: "The same vault + NFT model that works for phones and collectibles extends to groceries, everyday goods, and circular economies — physical truth, digital rails.",
    icon: "🌱",
  },
];

export const WAREHOUSE_STEPS = [
  {
    step: "01",
    title: "Intake & scan",
    desc: "Seller ships to the NFTBAY warehouse. Barcode, photos, and condition capture on arrival.",
    icon: "📥",
  },
  {
    step: "02",
    title: "Verify & grade",
    desc: "Ops team + AI appraisal confirm authenticity, working order, and fair market value.",
    icon: "✓",
  },
  {
    step: "03",
    title: "Custody & mint",
    desc: "Item enters insured vault storage. NFT mints with Q-HASH trust chain tied to the physical unit.",
    icon: "🏦",
  },
  {
    step: "04",
    title: "List or redeem",
    desc: "Trade on market, auction, or pawn — or burn the NFT to ship the real item to a new owner.",
    icon: "↗",
  },
];

export const EXPANSION_ROADMAP = [
  {
    phase: "Now",
    title: "Tech & collectibles",
    items: ["Smartphones & laptops", "Gaming & audio", "Trading cards & jewelry", "Cameras & wearables"],
  },
  {
    phase: "Next",
    title: "Broader physical goods",
    items: ["Small appliances", "Tools & home gear", "Sporting goods", "Designer accessories"],
  },
  {
    phase: "Vision",
    title: "Everyday vault commerce",
    items: ["Grocery partnerships", "Local pickup hubs", "Circular e-waste loops", "Receipt-grade on-chain proof"],
  },
];

export const INCENTIVE_CATEGORIES = [
  "phone",
  "laptop",
  "tech",
  "gaming",
  "audio",
  "camera",
  "jewelry",
  "watch",
  "card",
  "collectible",
  "vintage",
  "art",
] as const;

export const WAREHOUSE_HUB = {
  name: "NFTBAY Verification Hub",
  location: "Austin, TX — central custody",
  tagline: "Every item verified here before it trades on-chain.",
  capabilities: [
    "Climate-controlled storage",
    "Barcode + photo intake",
    "Condition grading (1–5)",
    "Insured custody",
    "Q-HASH trust chain",
    "Ship-out on NFT burn",
  ],
};