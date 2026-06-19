import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import Link from "next/link";
import Layout from "../../components/Layout";
import { getProgram, CONDITIONS } from "../../lib/anchor";
import { burnVaultNft, fetchNftImage } from "../../lib/burn";
import { VaultItem } from "../../lib/fetchOwnedItems";

type Step = "form" | "processing" | "done";

interface ShippingForm {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

export default function RedeemPage() {
  const router = useRouter();
  const mintAddress = router.query.mint as string;
  const { connection } = useConnection();
  const wallet = useWallet();

  const [item, setItem] = useState<VaultItem | null>(null);
  const [itemPda, setItemPda] = useState<PublicKey | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const [form, setForm] = useState<ShippingForm>({
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    phone: "",
  });

  useEffect(() => {
    if (mintAddress && wallet.connected && wallet.publicKey) {
      loadItem();
    }
  }, [mintAddress, wallet.connected, wallet.publicKey]);

  async function loadItem() {
    if (!wallet.publicKey || !mintAddress) return;
    try {
      const program = getProgram(wallet, connection);
      const allRecords = await program.account.itemRecord.all();
      const match = allRecords.find(
        ({ account }) => account.nftMint.toString() === mintAddress
      );
      if (!match) {
        setError("No vault record found for this NFT.");
        return;
      }
      const { publicKey, account } = match;
      setItemPda(publicKey);
      setItem({
        pda: publicKey,
        itemId: account.itemId,
        name: account.name,
        nftMint: account.nftMint.toString(),
        condition: account.condition,
        appraisedValueUsdCents: account.appraisedValueUsdCents.toNumber(),
        status: account.status,
        mintedAt: account.mintedAt.toNumber(),
        shippingAddress: account.shippingAddress,
        category: (account as any).category || "Other",
      });

      fetchNftImage(mintAddress, connection.rpcEndpoint).then(setImage);
    } catch (e: any) {
      setError(e.message);
    }
  }

  function field(key: keyof ShippingForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildAddressString(): string {
    const parts = [
      form.fullName,
      form.line1,
      form.line2,
      `${form.city}, ${form.state} ${form.zip}`,
      form.country,
      form.phone ? `Phone: ${form.phone}` : "",
    ].filter(Boolean);
    return parts.join("\n");
  }

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet.connected || !wallet.publicKey || !item || !itemPda) return;
    if (!confirmed) {
      setError("Please confirm you understand this action is irreversible.");
      return;
    }

    setError("");
    setStep("processing");

    try {
      const program = getProgram(wallet, connection);
      const shippingAddress = buildAddressString();

      // 1. Get user's ATA for this NFT
      const nftTokenAccount = getAssociatedTokenAddressSync(
        new PublicKey(item.nftMint),
        wallet.publicKey
      );

      // 2. Record redemption on-chain (stores shipping address in ItemRecord)
      setStatusMsg("Recording redemption on-chain — approve in wallet...");
      await program.methods
        .redeemItem(item.itemId, shippingAddress)
        .accounts({
          item: itemPda,
          nftTokenAccount,
          owner: wallet.publicKey,
        })
        .rpc();

      // 3. Burn the NFT
      setStatusMsg("Burning NFT — approve in wallet...");
      await burnVaultNft(wallet, connection.rpcEndpoint, item.nftMint);

      setStep("done");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Transaction failed. Check console for details.");
      setStep("form");
    }
  }

  const valueUsd =
    item &&
    (item.appraisedValueUsdCents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  /* ── Done ── */
  if (step === "done") {
    return (
      <Layout>
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="text-5xl mb-5">📦</div>
          <h1 className="text-2xl font-bold mb-3">Redemption Confirmed</h1>
          <p className="text-gray-400 mb-2">
            Your NFT has been burned and the physical item will be shipped to:
          </p>
          <div className="bg-[#141414] border border-white/5 rounded-xl p-4 text-sm text-left text-gray-300 mb-6 whitespace-pre-wrap">
            {buildAddressString()}
          </div>
          <p className="text-gray-600 text-sm mb-8">
            Expect an email with tracking info within 1–2 business days.
          </p>
          <Link
            href="/"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl"
          >
            Back to My Collection
          </Link>
        </div>
      </Layout>
    );
  }

  /* ── Processing ── */
  if (step === "processing") {
    return (
      <Layout>
        <div className="max-w-lg mx-auto text-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500 mx-auto mb-6" />
          <p className="text-gray-400">{statusMsg}</p>
        </div>
      </Layout>
    );
  }

  /* ── Form ── */
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-gray-600 hover:text-gray-400 text-sm mb-6 inline-block">
          ← Back to collection
        </Link>

        <h1 className="text-2xl font-bold mb-1">Redeem Physical Item</h1>
        <p className="text-gray-500 text-sm mb-8">
          Your NFT will be permanently burned. The physical item ships to the address below.
        </p>

        {/* Item preview */}
        {item && (
          <div className="flex gap-4 bg-[#141414] border border-white/5 rounded-xl p-4 mb-8">
            <div className="w-20 h-20 rounded-lg bg-[#1a1a1a] overflow-hidden flex-shrink-0">
              {image ? (
                <img src={image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-white">{item.name}</h2>
              <p className="text-gray-600 text-xs">{item.itemId}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-gray-400">
                  {CONDITIONS[item.condition]} condition
                </span>
                <span className="text-amber-400 font-semibold">{valueUsd}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {!wallet.connected ? (
          <p className="text-gray-500 text-center py-8">Connect your wallet to redeem.</p>
        ) : (
          <form onSubmit={handleRedeem} className="space-y-6">
            {/* Shipping address */}
            <div className="bg-[#141414] border border-white/5 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Shipping Address
              </h2>

              <Input label="Full Name *" value={form.fullName} onChange={(v) => field("fullName", v)} placeholder="Jane Smith" />
              <Input label="Address Line 1 *" value={form.line1} onChange={(v) => field("line1", v)} placeholder="123 Main Street" />
              <Input label="Address Line 2" value={form.line2} onChange={(v) => field("line2", v)} placeholder="Apt, Suite, Unit (optional)" />

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Input label="City *" value={form.city} onChange={(v) => field("city", v)} placeholder="Austin" />
                </div>
                <div>
                  <Input label="State *" value={form.state} onChange={(v) => field("state", v)} placeholder="TX" />
                </div>
                <div>
                  <Input label="ZIP *" value={form.zip} onChange={(v) => field("zip", v)} placeholder="78701" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Country *" value={form.country} onChange={(v) => field("country", v)} placeholder="US" />
                <Input label="Phone (for courier)" value={form.phone} onChange={(v) => field("phone", v)} placeholder="+1 555 000 0000" />
              </div>
            </div>

            {/* Warning + confirmation */}
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 text-sm space-y-3">
              <p className="text-amber-300 font-medium">This action cannot be undone</p>
              <ul className="text-amber-200/70 space-y-1 list-disc list-inside">
                <li>Your NFT will be permanently burned</li>
                <li>The on-chain vault record will be marked redeemed</li>
                <li>The physical item ships to the address above within 3–5 business days</li>
              </ul>
              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-amber-200/80">
                  I understand this is irreversible and my shipping address is correct
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!confirmed || !item}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors"
            >
              Confirm Redemption & Burn NFT
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0f0f0f] border border-white/8 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-gray-700"
        required={label.endsWith("*")}
      />
    </div>
  );
}
