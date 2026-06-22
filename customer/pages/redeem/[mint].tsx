import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
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

      const nftTokenAccount = getAssociatedTokenAddressSync(
        new PublicKey(item.nftMint),
        wallet.publicKey
      );

      setStatusMsg("Recording redemption on-chain — approve in wallet...");
      await program.methods
        .redeemItem(item.itemId, shippingAddress)
        .accounts({
          item: itemPda,
          nftTokenAccount,
          owner: wallet.publicKey,
        })
        .rpc();

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

  if (step === "done") {
    return (
      <Layout>
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="text-5xl mb-5">✓</div>
          <h1 className="text-2xl font-bold mb-3">Redemption Confirmed</h1>
          <p className="text-gray-400 mb-2">
            NFT burned. Your item will be shipped to:
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

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-gray-600 hover:text-gray-400 text-sm mb-6 inline-block">
          ← Back to collection
        </Link>

        <h1 className="text-2xl font-bold mb-1">Redeem Item</h1>
        <p className="text-gray-500 text-sm mb-8">
          Burn your NFT and we'll ship the physical item to your address. This cannot be undone.
        </p>

        {!wallet.connected ? (
          <div className="text-center py-16 text-gray-600">Connect your wallet to redeem.</div>
        ) : !item ? (
          error ? (
            <div className="text-red-400 text-sm bg-red-900/20 rounded-xl p-4">{error}</div>
          ) : (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500" />
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Item card */}
            <div>
              <div className="aspect-square ios-card overflow-hidden mb-4">
                {image ? (
                  <img src={image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t border-gray-700" />
                  </div>
                )}
              </div>
              <h2 className="font-semibold text-white mb-1">{item.name}</h2>
              <p className="text-gray-600 text-xs mb-1">{item.itemId}</p>
              <p className="text-amber-400 font-medium">{valueUsd}</p>
              <p className="text-gray-500 text-xs mt-1">{CONDITIONS[item.condition]}</p>
            </div>

            {/* Shipping form */}
            <form onSubmit={handleRedeem} className="space-y-4">
              {[
                { key: "fullName", label: "Full Name", placeholder: "Jane Smith" },
                { key: "line1", label: "Address Line 1", placeholder: "123 Main St" },
                { key: "line2", label: "Address Line 2 (optional)", placeholder: "Apt 4B" },
                { key: "city", label: "City", placeholder: "Austin" },
                { key: "state", label: "State / Province", placeholder: "TX" },
                { key: "zip", label: "ZIP / Postal Code", placeholder: "78701" },
                { key: "country", label: "Country", placeholder: "US" },
                { key: "phone", label: "Phone (optional)", placeholder: "+1 512 000 0000" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                  <input
                    type="text"
                    value={form[key as keyof ShippingForm]}
                    onChange={(e) => field(key as keyof ShippingForm, e.target.value)}
                    placeholder={placeholder}
                    required={key !== "line2" && key !== "phone"}
                    className="w-full ios-input text-sm placeholder:text-[rgba(235,235,245,0.3)]"
                  />
                </div>
              ))}

              <label className="flex items-start gap-3 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 accent-amber-500"
                />
                <span className="text-xs text-gray-500">
                  I understand that burning this NFT is permanent and irreversible. The physical item will be shipped to the address above.
                </span>
              </label>

              {error && (
                <p className="text-red-400 text-xs bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                className="w-full ios-btn ios-btn-primary disabled:opacity-40"
              >
                Burn NFT & Ship Item
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}
