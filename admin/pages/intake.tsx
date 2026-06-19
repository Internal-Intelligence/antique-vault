import { useState, useRef, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import Link from "next/link";
import Layout from "../components/Layout";
import { getProgram, getVaultPda, getItemPda, CONDITIONS, CATEGORIES } from "../lib/anchor";
import { mintCollectibleNft } from "../lib/mint";
import {
  uploadImageToPinata,
  uploadMetadataToPinata,
  buildNftMetadata,
} from "../lib/upload";

type Step = "form" | "minting" | "done";

interface FormData {
  itemId: string;
  name: string;
  category: string;
  condition: number;
  appraisedValueUsd: string;
  description: string;
}

const CONDITION_DESCRIPTIONS = [
  "Heavy damage or missing parts",
  "Heavy wear, chips, fading",
  "Light wear, minor chips",
  "Light wear, slight marks",
  "Near perfect, tiny imperfections",
  "Perfect — may still be in original packaging",
];

export default function Intake() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("form");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [mintStatus, setMintStatus] = useState("");
  const [mintedNftAddress, setMintedNftAddress] = useState("");
  const [mintedItemId, setMintedItemId] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormData>({
    itemId: "",
    name: "",
    category: "Toy Vehicles",
    condition: 4,
    appraisedValueUsd: "",
    description: "",
  });

  // Generate a unique item ID on mount to avoid SSR mismatch
  useEffect(() => {
    const ts = Date.now().toString(36).toUpperCase();
    setForm((prev) => ({ ...prev, itemId: `VAULT-${ts}` }));
  }, []);

  function handleField(field: keyof FormData, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files]);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...urls]);
  }

  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleMint(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!wallet.connected || !wallet.publicKey) {
      setError("Connect your wallet first.");
      return;
    }
    if (!form.name.trim()) { setError("Item name is required."); return; }
    if (!form.itemId.trim()) { setError("Item ID is required."); return; }
    if (!form.appraisedValueUsd || parseFloat(form.appraisedValueUsd) <= 0) {
      setError("Appraised value must be greater than zero.");
      return;
    }
    if (photos.length === 0) {
      setError("Upload at least one photo.");
      return;
    }

    setStep("minting");

    try {
      // 1. Upload photos to IPFS
      setMintStatus(`Uploading ${photos.length} photo(s) to IPFS...`);
      const imageUris: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        setMintStatus(`Uploading photo ${i + 1} of ${photos.length}...`);
        const uri = await uploadImageToPinata(photos[i]);
        imageUris.push(uri);
      }

      // 2. Build + upload metadata JSON
      setMintStatus("Uploading metadata...");
      const metadata = buildNftMetadata({
        name: form.name,
        description: form.description || `${form.category} — ${CONDITIONS[form.condition]} condition`,
        category: form.category,
        condition: CONDITIONS[form.condition],
        appraisedValueUsd: form.appraisedValueUsd,
        itemId: form.itemId,
        imageUri: imageUris[0],
        additionalImageUris: imageUris.slice(1),
      });
      const metadataUri = await uploadMetadataToPinata(metadata);

      // 3. Mint NFT on Solana via Metaplex
      setMintStatus("Minting NFT — approve in your wallet...");
      const mintAddress = await mintCollectibleNft(
        wallet,
        connection.rpcEndpoint,
        metadataUri,
        form.name
      );

      // 4. Initialize vault if needed, then register item
      setMintStatus("Recording in vault program...");
      const program = getProgram(wallet, connection);
      const [vaultPda] = getVaultPda(wallet.publicKey);
      const [itemPda] = getItemPda(vaultPda, form.itemId);

      try {
        await program.account.vault.fetch(vaultPda);
      } catch {
        // Vault doesn't exist yet — initialize it first
        await program.methods
          .initializeVault()
          .accounts({
            vault: vaultPda,
            authority: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      }

      await program.methods
        .registerItem(
          form.itemId,
          form.name,
          form.condition,
          new BN(Math.round(parseFloat(form.appraisedValueUsd) * 100)),
          form.category
        )
        .accounts({
          vault: vaultPda,
          item: itemPda,
          nftMint: new PublicKey(mintAddress),
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setMintedNftAddress(mintAddress);
      setMintedItemId(form.itemId);
      setStep("done");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Minting failed. Check console for details.");
      setStep("form");
    }
  }

  function startAnother() {
    setStep("form");
    setPhotos([]);
    setPreviews([]);
    setMintedNftAddress("");
    const ts = Date.now().toString(36).toUpperCase();
    setForm({
      itemId: `VAULT-${ts}`,
      name: "",
      category: "Toy Vehicles",
      condition: 4,
      appraisedValueUsd: "",
      description: "",
    });
  }

  // ── Done screen ────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <Layout>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-white mb-2">NFT Minted</h2>
          <p className="text-gray-400 mb-6">
            <strong className="text-white">{form.name}</strong> is now tokenized and on-chain.
          </p>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-left mb-8 space-y-2 text-sm">
            <Row label="Item ID" value={mintedItemId} />
            <div className="flex justify-between">
              <span className="text-gray-500">NFT Mint</span>
              <a
                href={`https://explorer.solana.com/address/${mintedNftAddress}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline font-mono text-xs"
              >
                {mintedNftAddress.slice(0, 8)}...{mintedNftAddress.slice(-8)}
              </a>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={startAnother}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2 rounded-lg"
            >
              Intake Another
            </button>
            <Link
              href="/"
              className="border border-[#2a2a2a] hover:border-gray-500 text-gray-300 px-5 py-2 rounded-lg"
            >
              View Inventory
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Minting progress screen ────────────────────────────────────────────────
  if (step === "minting") {
    return (
      <Layout>
        <div className="max-w-lg mx-auto text-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500 mx-auto mb-6" />
          <h2 className="text-xl font-semibold mb-2">Minting in Progress</h2>
          <p className="text-gray-400 text-sm">{mintStatus}</p>
        </div>
      </Layout>
    );
  }

  // ── Intake form ────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Intake New Item</h1>
          <p className="text-gray-500 text-sm mt-1">
            Fill in the details, upload photos, then mint the NFT. The physical item stays in your
            warehouse.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleMint} className="space-y-6">
          {/* ── Item Identity ── */}
          <Section title="Item Identity">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Item ID *">
                <input
                  value={form.itemId}
                  onChange={(e) => handleField("itemId", e.target.value)}
                  placeholder="MC-001"
                  maxLength={32}
                  required
                />
              </Field>
              <Field label="Category">
                <select
                  value={form.category}
                  onChange={(e) => handleField("category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Item Name *">
              <input
                value={form.name}
                onChange={(e) => handleField("name", e.target.value)}
                placeholder="1969 Hot Wheels Beach Bomb — Pink"
                maxLength={64}
                required
              />
            </Field>
            <Field label="Description (appears in NFT metadata)">
              <textarea
                value={form.description}
                onChange={(e) => handleField("description", e.target.value)}
                rows={3}
                placeholder="Original blister pack intact. Pink color variant. Near perfect casting..."
              />
            </Field>
          </Section>

          {/* ── Condition & Value ── */}
          <Section title="Condition & Value">
            <Field
              label={`Condition: ${CONDITIONS[form.condition]} — ${CONDITION_DESCRIPTIONS[form.condition]}`}
            >
              <input
                type="range"
                min={0}
                max={5}
                value={form.condition}
                onChange={(e) => handleField("condition", parseInt(e.target.value))}
                className="w-full accent-amber-500 bg-transparent border-0 px-0 py-0"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Poor</span>
                <span>Fair</span>
                <span>Good</span>
                <span>V.Good</span>
                <span>Excellent</span>
                <span>Mint</span>
              </div>
            </Field>
            <Field label="Appraised Value (USD) *">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={form.appraisedValueUsd}
                  onChange={(e) => handleField("appraisedValueUsd", e.target.value)}
                  placeholder="4500"
                  min="0.01"
                  step="0.01"
                  className="pl-7"
                  required
                />
              </div>
            </Field>
          </Section>

          {/* ── Photos ── */}
          <Section title="Photos">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#2a2a2a] hover:border-amber-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors"
            >
              <p className="text-gray-400 text-sm">Click to upload photos (multiple allowed)</p>
              <p className="text-gray-600 text-xs mt-1">First photo becomes the NFT cover image</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {previews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {previews.map((url, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 bg-amber-500 text-black text-xs px-1 rounded font-bold">
                        COVER
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ── Submit ── */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!wallet.connected}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg text-sm transition-colors"
            >
              {wallet.connected ? "Mint NFT & Register Item" : "Connect Wallet to Mint"}
            </button>
            <Link
              href="/"
              className="px-4 py-3 border border-[#2a2a2a] text-gray-400 rounded-lg text-sm hover:text-white transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label>{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}
