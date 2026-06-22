import React, { useCallback } from "react";
import { useRouter } from "next/router";
import { useConnection } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { useNftCardImage } from "../hooks/useNftCardImage";
import { deriveNftCard, deterministicTrustScore } from "../lib/nftCard";
import type { NftCardProps } from "../lib/nftCard/types";
import {
  NftCardMedia,
  NftCardBody,
  NftCardTrustStrip,
  NftCardBoostClaim,
  NftCardActions,
  NftCardFooter,
} from "./nftCard/index";

export type { NftCardItem, NftCardProps } from "../lib/nftCard/types";

const CARD_CLASS =
  "quantum-card quantum-prob group cursor-pointer casino-card ios-card";

function NftCardInner({
  item,
  mode = "portfolio",
  onStore,
  onList,
  onBuy,
  buying = false,
  showActions = true,
}: NftCardProps) {
  const router = useRouter();
  const { connection } = useConnection();
  const { image, loading } = useNftCardImage(
    item.nftMint,
    item.image,
    connection.rpcEndpoint,
  );
  const derived = deriveNftCard(item);
  const trustScore = deterministicTrustScore(item.itemId);

  const handleCardClick = useCallback(() => {
    if (mode === "market") router.push("/acquire");
  }, [mode, router]);

  const onBubblePress = useCallback((label: string) => {
    if (process.env.NODE_ENV === "development") {
      console.info(`[TRUST] ${label}`);
    }
  }, []);

  const onBoostClaim = useCallback(() => {
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[BOOST CLAIM] ${item.boostPercent ?? 8}% booster share for ${item.nftMint}`,
      );
    }
  }, [item.boostPercent, item.nftMint]);

  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={CARD_CLASS}
      onClick={mode === "market" ? handleCardClick : undefined}
      role={mode === "market" ? "link" : undefined}
      tabIndex={mode === "market" ? 0 : undefined}
      onKeyDown={
        mode === "market"
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick();
              }
            }
          : undefined
      }
    >
      <NftCardMedia
        image={image}
        loading={loading}
        item={item}
        derived={derived}
        trustScore={trustScore}
      />
      <div className="p-3.5 space-y-2.5">
        <NftCardBody item={item} derived={derived} />
        <NftCardTrustStrip
          item={item}
          derived={derived}
          trustBadges={derived.trustBadges}
          onBubblePress={onBubblePress}
        />
        {item.boosted && item.boosterClaimable !== false && (
          <NftCardBoostClaim
            boostPercent={item.boostPercent ?? 8}
            onClaim={onBoostClaim}
          />
        )}
        {showActions && !derived.isRedeemed && (
          <NftCardActions
            item={item}
            mode={mode}
            onStore={onStore}
            onList={onList}
            onBuy={onBuy}
            buying={buying}
          />
        )}
        {derived.isRedeemed && mode === "portfolio" && (
          <p className="text-center text-[10px] text-gray-500 py-1 tracking-wide">
            SHIPMENT IN PROGRESS
          </p>
        )}
        <NftCardFooter showPromoted={derived.showPromoted} />
      </div>
    </motion.div>
  );
}

const NftCard = React.memo(function NftCard(props: NftCardProps) {
  return <NftCardInner {...props} />;
});

NftCard.displayName = "NftCard";

export default NftCard;