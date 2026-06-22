import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Layout from "../components/Layout";
import { HomePage } from "../components/home";
import { IosModal, IosRow } from "../components/IosModal";
import ListItemModal, { type ListingMode } from "../components/listing/ListItemModal";
import { getProgram } from "../lib/anchor";
import { fetchOwnedVaultItems, type VaultItem } from "../lib/fetchOwnedItems";

type Modal = "store" | "list" | null;

export default function Home() {
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [listItem, setListItem] = useState<VaultItem | null>(null);
  const [listMode, setListMode] = useState<ListingMode>("fixed");
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
    const mintQ = typeof router.query.mint === "string" ? router.query.mint : undefined;
    const inVault =
      (mintQ ? items.find((i) => i.nftMint === mintQ) : undefined) ??
      items.find((i) => i.status === 0) ??
      items[0];
    setListItem(inVault);
    setListMode(router.query.mode === "auction" ? "auction" : "fixed");
    setModal("list");
    if (router.query.boost === "1") pendingListBoost.current = true;
    router.replace("/", undefined, { shallow: true });
  }, [router.isReady, router.query.action, router.query.mode, router.query.mint, router.query.boost, items]);

  return (
    <Layout wide>
      <HomePage />

      {modal === "store" && (
        <IosModal onClose={() => setModal(null)}>
          <div className="text-center">
            <div className="text-4xl mb-4">🏦</div>
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
        <ListItemModal
          item={listItem}
          initialMode={listMode}
          initialBoost={pendingListBoost.current}
          onClose={() => {
            setModal(null);
            setListItem(null);
            pendingListBoost.current = false;
          }}
          onListed={(mode) => {
            if (mode === "auction") {
              router.push("/auctions");
            }
          }}
        />
      )}
    </Layout>
  );
}