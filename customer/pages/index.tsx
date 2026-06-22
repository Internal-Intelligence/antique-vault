import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import Layout from "../components/Layout";
import { HomePage } from "../components/home";
import { IosModal, IosRow } from "../components/IosModal";
import FeeDisclosure from "../components/FeeDisclosure";
import { getProgram, requireIdVerification } from "../lib/anchor";
import { fetchOwnedVaultItems, type VaultItem } from "../lib/fetchOwnedItems";
import { getNeurochipBoosterDecision } from "../lib/quantum";
import {
  getNftBayProgram,
  createNftBayListing,
  getSellerNftAta,
  getPlatformFeeRecipient,
} from "../lib/nftbay";

type Modal = "store" | "list" | null;

export default function Home() {
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [listItem, setListItem] = useState<VaultItem | null>(null);
  const [neuroDecision, setNeuroDecision] = useState<ReturnType<typeof getNeurochipBoosterDecision> | null>(null);
  const [selectedBoosterBps, setSelectedBoosterBps] = useState(420);
  const [selectedOwnerFeeBps, setSelectedOwnerFeeBps] = useState(500);
  const [listingStatus, setListingStatus] = useState("");
  const pendingListBoost = useRef(false);

  useEffect(() => {
    if (!wallet.connected || !wallet.publicKey) return;
    const program = getProgram(wallet, connection);
    fetchOwnedVaultItems(program, connection, wallet.publicKey)
      .then(setItems)
      .catch(console.error);
  }, [wallet.connected, wallet.publicKey, connection]);

  useEffect(() => {
    if (!router.isReady || router.query.action !== "list" || items.length === 0) return;
    const inVault = items.find((i) => i.status === 0) ?? items[0];
    setListItem(inVault);
    setModal("list");
    if (router.query.boost === "1") pendingListBoost.current = true;
    router.replace("/", undefined, { shallow: true });
  }, [router.isReady, router.query.action, router.query.boost, items]);

  useEffect(() => {
    if (listItem && modal === "list") {
      const priceApprox = (listItem.appraisedValueUsdCents || 4500) * 100000;
      const dec = getNeurochipBoosterDecision(priceApprox, listItem.category || "General", 0.55, items.length);
      const boosted = pendingListBoost.current;
      setNeuroDecision(dec);
      setSelectedBoosterBps(Math.floor(dec.xPct * 10000));
      setSelectedOwnerFeeBps(boosted ? 800 : dec.ownerFeeBps);
      setListingStatus(boosted ? "Boost mode — promoted 8% fee selected" : "");
      pendingListBoost.current = false;
    }
  }, [listItem, modal, items.length]);

  return (
    <Layout wide>
      <HomePage />

      {modal === "store" && (
        <IosModal onClose={() => setModal(null)}>
          <div className="text-center">
            <div className="text-3xl mb-4">🏦</div>
            <h2 className="text-[20px] font-semibold mb-2 tracking-[-0.4px]">Vault Storage</h2>
            <p className="text-[rgba(235,235,245,0.6)] leading-relaxed mb-4 text-[15px]">
              Your item is safely stored in our climate-controlled warehouse. Hold your NFT — redeem anytime.
            </p>
            <div className="ios-inset text-sm text-left mb-4">
              <IosRow label="Storage fee" value="$9.99 / month" />
              <IosRow label="Insurance" value="Included up to appraised value" />
              <IosRow label="Access" value="Redeem anytime by burning your NFT" />
            </div>
          </div>
        </IosModal>
      )}

      {modal === "list" && listItem && (
        <IosModal
          onClose={() => {
            setModal(null);
            setListItem(null);
            setNeuroDecision(null);
            setListingStatus("");
          }}
        >
          <div className="text-center">
            <div className="text-3xl mb-3">🏷️</div>
            <h2 className="text-xl font-bold mb-1">List on NFTBAY Marketplace</h2>
            <p className="text-gray-500 text-sm mb-4">
              5% standard · 8% promoted. AI suggests optimal promotion for visibility.
            </p>
            <div className="ios-inset text-sm text-left mb-4">
              <IosRow label="Item" value={listItem.name} />
              <IosRow label="Est value" value={`$${(listItem.appraisedValueUsdCents / 100).toFixed(0)}`} />
              <IosRow label="Platform fee" value={`${(selectedOwnerFeeBps / 100).toFixed(1)}%`} />
            </div>
            {neuroDecision && (
              <div className="mb-5 ios-inset text-left">
                <div className="uppercase tracking-[1.5px] text-[10px] text-[#22ffaa] mb-1">AI promotion suggestion</div>
                <div className="text-lg font-bold text-white mb-1">
                  {(neuroDecision.xPct * 100).toFixed(1)}% promoter share · {(selectedOwnerFeeBps / 100).toFixed(1)}% platform
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[250, 420, 650].map((bp) => (
                    <button
                      key={bp}
                      type="button"
                      onClick={() => setSelectedBoosterBps(bp)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        selectedBoosterBps === bp ? "border-emerald-400 bg-emerald-500/10" : "border-white/10"
                      }`}
                    >
                      {(bp / 100).toFixed(1)}%
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              type="button"
              disabled={!wallet.connected || !neuroDecision}
              onClick={async () => {
                if (!wallet.publicKey || !listItem) return;
                requireIdVerification("home-list-" + listItem.itemId, "secondary-list");
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
                    getPlatformFeeRecipient() ?? PublicKey.default,
                    selectedBoosterBps,
                    0,
                    neuroDecision?.neuroScore || 78
                  );
                  setListingStatus("Listed on devnet.");
                } catch (e: any) {
                  setListingStatus("Sign with wallet: " + (e.message || "failed"));
                }
              }}
              className="w-full ios-btn ios-btn-primary disabled:opacity-50 mb-2"
            >
              Activate listing
            </button>
            <div className="text-[10px] text-center text-emerald-400 mb-3 h-4">{listingStatus}</div>
            <FeeDisclosure compact promoted={selectedOwnerFeeBps >= 800} />
          </div>
        </IosModal>
      )}
    </Layout>
  );
}