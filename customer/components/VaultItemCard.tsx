import React from "react";
import NftCard, { NftCardItem } from "./NftCard";
import { VaultItem } from "../lib/fetchOwnedItems";

// Thin adapter: VaultItemCard wraps NftCard for portfolio vault items.

interface Props {
  item: VaultItem;
  onStore: () => void;
  onList: () => void;
}

export default function VaultItemCard({ item, onStore, onList }: Props) {
  const nftCardItem: NftCardItem = {
    nftMint: item.nftMint,
    name: item.name,
    itemId: item.itemId,
    condition: item.condition,
    appraisedValueUsdCents: item.appraisedValueUsdCents,
    status: item.status,
    category: item.category || "General",
  };

  return (
    <NftCard
      item={nftCardItem}
      mode="portfolio"
      onStore={onStore}
      onList={onList}
    />
  );
}
