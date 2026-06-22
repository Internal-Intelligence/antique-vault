import { motion, AnimatePresence } from "framer-motion";
import { deriveNftCard, deterministicTrustScore } from "../../lib/nftCard";
import {
  buildPreviewNftItem,
  derivePreviewMint,
  getCategoryVisual,
  getMetadataProgress,
  getMintStageIndex,
  getMintStageLabel,
  getPreviewDisplayName,
  STAGE_STEPS,
  CONDITIONS,
  type SellMintStage,
} from "../../lib/sell/nftPreview";
import type { PawnForm } from "../../lib/sell";

interface SellNftMintPreviewProps {
  form: PawnForm;
  stage: SellMintStage;
  offerUsd?: number;
  boostEnabled?: boolean;
  boostPercent?: number;
  compact?: boolean;
}

export default function SellNftMintPreview({
  form,
  stage,
  offerUsd,
  boostEnabled = false,
  boostPercent = 8,
  compact = false,
}: SellNftMintPreviewProps) {
  const item = buildPreviewNftItem(form, {
    offerUsd,
    boosted: boostEnabled,
    boostPercent,
  });
  const derived = deriveNftCard(item);
  const visual = getCategoryVisual(form.category);
  const displayName = getPreviewDisplayName(form);
  const progress = getMetadataProgress(form);
  const stageIndex = getMintStageIndex(stage);
  const trustScore = deterministicTrustScore(item.itemId);
  const isMinted = stage === "minted";

  return (
    <div className={`sell-nft-preview ${compact ? "sell-nft-preview--compact" : ""}`}>
      <div className="sell-nft-preview__header">
        <p className="sell-nft-preview__kicker">Live NFT preview</p>
        <p className="sell-nft-preview__hint">This is the token that mints once your gear hits the vault.</p>
      </div>

      <motion.article
        layout
        className={`sell-nft-preview__card ${isMinted ? "sell-nft-preview__card--minted" : ""}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={`sell-nft-preview__visual bg-gradient-to-br ${visual.gradient}`}>
          <motion.span
            key={visual.icon}
            className="sell-nft-preview__emoji"
            initial={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            aria-hidden
          >
            {visual.icon}
          </motion.span>

          <div className="sell-nft-preview__badges">
            <span className="sell-nft-preview__badge">{derived.rwaType}</span>
            <span className="sell-nft-preview__badge sell-nft-preview__badge--score">Q{trustScore}</span>
            {boostEnabled && (
              <span className="sell-nft-preview__badge sell-nft-preview__badge--boost">
                ⚡ +{boostPercent}%
              </span>
            )}
          </div>

          <div className="sell-nft-preview__status-pill">
            {derived.workingStatus} • {CONDITIONS[form.condition]}
          </div>

          {stage === "draft" && (
            <div className="sell-nft-preview__draft-overlay" aria-hidden>
              <div className="sell-nft-preview__draft-bar">
                <motion.div
                  className="sell-nft-preview__draft-fill"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          )}

          {isMinted && <div className="sell-nft-preview__mint-glow" aria-hidden />}
        </div>

        <div className="sell-nft-preview__body">
          <AnimatePresence mode="wait">
            <motion.h3
              key={displayName}
              className="sell-nft-preview__name"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
            >
              {displayName}
            </motion.h3>
          </AnimatePresence>
          <p className="sell-nft-preview__id">{item.itemId}</p>

          <div className="sell-nft-preview__meta">
            <span>{form.category}</span>
            {offerUsd != null && stage !== "draft" && (
              <span className="sell-nft-preview__offer">${offerUsd} offer</span>
            )}
          </div>

          <div className="sell-nft-preview__mint-row">
            <span className="sell-nft-preview__mint-label">Mint</span>
            <AnimatePresence mode="wait">
              <motion.code
                key={derivePreviewMint(form)}
                className="sell-nft-preview__mint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {derivePreviewMint(form)}
              </motion.code>
            </AnimatePresence>
          </div>
        </div>
      </motion.article>

      <div className="sell-nft-preview__stage">
        <div className="sell-nft-preview__stage-label">
          <span
            className={`sell-nft-preview__pulse ${stage === "draft" ? "sell-nft-preview__pulse--active" : ""}`}
            aria-hidden
          />
          {getMintStageLabel(stage)}
        </div>

        <div className="sell-nft-preview__pipeline" role="list" aria-label="Mint pipeline">
          {STAGE_STEPS.map((step, i) => {
            const done = i < stageIndex;
            const active = i === stageIndex;
            return (
              <div
                key={step.key}
                role="listitem"
                className={`sell-nft-preview__step ${done ? "sell-nft-preview__step--done" : ""} ${active ? "sell-nft-preview__step--active" : ""}`}
              >
                <span className="sell-nft-preview__step-dot" />
                <span className="sell-nft-preview__step-text">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {!compact && (
        <p className="sell-nft-preview__explainer">
          Describe your gear → accept the AI offer → ship to our vault → we mint this NFT to your wallet so you can
          list, hold, or redeem the physical item on-chain.
        </p>
      )}
    </div>
  );
}