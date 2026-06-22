import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, type Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";

export const ACQ_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ACQ_PROGRAM_ID || "BLtdqGyjYZ7H5WjqVG2EtvY4TGxVpAqd8gBE4ZvydVHg"
);

export const ACQ_IDL = {
  address: "BLtdqGyjYZ7H5WjqVG2EtvY4TGxVpAqd8gBE4ZvydVHg",
  version: "0.1.0",
  name: "acquisition_units",
  instructions: [
    {
      name: "buyUnits",
      accounts: [
        { name: "round", isMut: true, isSigner: false },
        { name: "unitMint", isMut: true, isSigner: false },
        { name: "buyerTokenAccount", isMut: true, isSigner: false },
        { name: "buyer", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "roundId", type: "u32" },
        { name: "unitCount", type: "u64" },
      ],
    },
  ],
  accounts: [
    {
      name: "AcquisitionRound",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "roundId", type: "u32" },
          { name: "targetLamports", type: "u64" },
          { name: "raisedLamports", type: "u64" },
          { name: "unitPriceLamports", type: "u64" },
          { name: "unitsSold", type: "u64" },
          { name: "description", type: "string" },
          { name: "status", type: "u8" },
          { name: "unitMint", type: "publicKey" },
          { name: "bump", type: "u8" },
          { name: "mintBump", type: "u8" },
        ],
      },
    },
  ],
  errors: [],
} as const;

export type AcquisitionRoundAccount = {
  pubkey: PublicKey;
  authority: PublicKey;
  roundId: number;
  targetLamports: BN;
  raisedLamports: BN;
  unitPriceLamports: BN;
  unitsSold: BN;
  description: string;
  status: number;
  unitMint: PublicKey;
};

export type FundPerk = {
  icon: string;
  title: string;
  desc: string;
};

export type FundStep = {
  step: string;
  title: string;
  desc: string;
  icon: string;
};

export type UpcomingRound = {
  id: string;
  title: string;
  category: string;
  tagline: string;
  targetSol: number;
  unitPriceSol: number;
  eta: string;
  icon: string;
};

export type UnitBundle = {
  id: string;
  label: string;
  units: number;
  hint: string;
};

export const FUND_STATS = [
  { label: "Min. unit", value: "0.05 SOL", detail: "Entry-level participation" },
  { label: "Your edge", value: "First pick", detail: "Priority when items mint" },
  { label: "On-chain", value: "UNIT tokens", detail: "Provable vault stake" },
  { label: "Loop", value: "Fees → fuel", detail: "Inventory + incentive bids" },
];

export const FUND_STEPS: FundStep[] = [
  {
    step: "01",
    icon: "💎",
    title: "Buy units",
    desc: "Deposit SOL into an open round. You receive UNIT tokens — your on-chain receipt of participation.",
  },
  {
    step: "02",
    icon: "📦",
    title: "We source gear",
    desc: "Vault ops acquire phones, laptops, and collectibles. AI appraisal runs before anything hits the market.",
  },
  {
    step: "03",
    icon: "🏦",
    title: "Items enter custody",
    desc: "Physical goods land in the insured vault. Each item backs an NFT listing on NFTBAY.",
  },
  {
    step: "04",
    icon: "⚡",
    title: "You get priority",
    desc: "Unit holders get early access to mints from rounds they funded — first in, first pick.",
  },
];

export const FUND_PERKS: FundPerk[] = [
  {
    icon: "🎯",
    title: "Priority mint window",
    desc: "Claim fresh inventory before the public market sees it.",
  },
  {
    icon: "🔗",
    title: "On-chain transparency",
    desc: "Every unit purchase is a Solana transaction. Raised SOL stays in the round PDA until close.",
  },
  {
    icon: "🤖",
    title: "AI-priced inventory",
    desc: "Acquired gear is valued with the same quantum intake models sellers use.",
  },
  {
    icon: "♻️",
    title: "Golden loop economics",
    desc: "Marketplace fees and boosts recycle into more acquisition fuel — the flywheel grows.",
  },
];

export const UNIT_BUNDLES: UnitBundle[] = [
  { id: "starter", label: "Starter", units: 1, hint: "Try a round" },
  { id: "builder", label: "Builder", units: 5, hint: "Meaningful stake" },
  { id: "whale", label: "Vault", units: 25, hint: "Max priority" },
];

export const UPCOMING_ROUNDS: UpcomingRound[] = [
  {
    id: "up-1",
    title: "Flagship Phone Buyback",
    category: "Smartphones",
    tagline: "iPhone & Samsung trade-ins for vault restock",
    targetSol: 120,
    unitPriceSol: 0.08,
    eta: "Opening soon",
    icon: "📱",
  },
  {
    id: "up-2",
    title: "Gaming Console Wave",
    category: "Gaming",
    tagline: "PS5, Switch OLED & handheld restock",
    targetSol: 85,
    unitPriceSol: 0.06,
    eta: "Next drop",
    icon: "🎮",
  },
  {
    id: "up-3",
    title: "Creator Camera Kit",
    category: "Cameras",
    tagline: "Mirrorless bodies & lens bundles",
    targetSol: 200,
    unitPriceSol: 0.12,
    eta: "In planning",
    icon: "📷",
  },
];

export const FUND_FAQ = [
  {
    q: "What am I actually buying?",
    a: "Acquisition units are SPL tokens tied to a specific funding round. They represent your stake in that round's inventory sourcing — not equity in NFTBAY, but priority access when those goods become vault-backed NFTs.",
  },
  {
    q: "When do I get access to items?",
    a: "After a round closes and gear is sourced, appraised, and minted. Unit holders are notified through their profile and get a priority window before public listings go live.",
  },
  {
    q: "Can I sell my units?",
    a: "UNIT tokens are standard SPL tokens on Solana. Secondary liquidity depends on whether a market exists for that round's mint — treat units as participation receipts, not guaranteed returns.",
  },
  {
    q: "What happens if a round doesn't fill?",
    a: "Open rounds stay open until the vault closes them or hits target. Always check round status on-chain before buying. Unfilled rounds may be extended or restructured by the round authority.",
  },
  {
    q: "How is this different from buying on Market?",
    a: "Market is for finished listings. Fund is upstream — you help stock the vault before items exist. That's why units carry priority, not guaranteed discounts.",
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAcqProgram(wallet: unknown, connection: Connection): any {
  const provider = new AnchorProvider(connection, wallet as never, { commitment: "confirmed" });
  return new Program(ACQ_IDL as never, provider);
}

export function getRoundPda(authority: PublicKey, roundId: number): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("round"), authority.toBuffer(), Buffer.from(new Uint32Array([roundId]).buffer)],
    ACQ_PROGRAM_ID
  )[0];
}

export function getUnitMintPda(authority: PublicKey, roundId: number): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("unit-mint"), authority.toBuffer(), Buffer.from(new Uint32Array([roundId]).buffer)],
    ACQ_PROGRAM_ID
  )[0];
}

export async function fetchOpenRounds(connection: Connection): Promise<AcquisitionRoundAccount[]> {
  const allAccounts = await connection.getProgramAccounts(ACQ_PROGRAM_ID, {
    filters: [{ dataSize: 243 }],
  });
  const provider = new AnchorProvider(connection, { publicKey: PublicKey.default } as never, {});
  const program = getAcqProgram({ publicKey: PublicKey.default }, connection);

  const decoded = await Promise.all(
    allAccounts.map(async ({ pubkey, account }) => {
      try {
        const data = program.coder.accounts.decode("AcquisitionRound", account.data);
        const roundId =
          typeof data.roundId === "number" ? data.roundId : (data.roundId as BN).toNumber();
        return { pubkey, ...data, roundId } as AcquisitionRoundAccount;
      } catch {
        return null;
      }
    })
  );

  return decoded
    .filter((r): r is AcquisitionRoundAccount => r !== null)
    .filter((r) => r.status === 0)
    .sort((a, b) => b.roundId - a.roundId);
}

export async function buyRoundUnits(
  wallet: { publicKey: PublicKey; signTransaction?: unknown; signAllTransactions?: unknown },
  connection: Connection,
  round: AcquisitionRoundAccount,
  unitCount: number
): Promise<string> {
  const program = getAcqProgram(wallet, connection);
  const roundPda = getRoundPda(round.authority, round.roundId);
  const unitMintPda = getUnitMintPda(round.authority, round.roundId);
  const { getAssociatedTokenAddressSync } = await import("@solana/spl-token");
  const buyerAta = getAssociatedTokenAddressSync(unitMintPda, wallet.publicKey);

  return program.methods
    .buyUnits(round.roundId, new BN(unitCount))
    .accounts({
      round: roundPda,
      unitMint: unitMintPda,
      buyerTokenAccount: buyerAta,
      buyer: wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export function lamportsToSol(lamports: BN | number): number {
  const n = typeof lamports === "number" ? lamports : lamports.toNumber();
  return n / LAMPORTS_PER_SOL;
}

export function roundProgress(raised: BN, target: BN): number {
  const t = target.toNumber();
  if (t <= 0) return 0;
  return Math.min(100, (raised.toNumber() / t) * 100);
}