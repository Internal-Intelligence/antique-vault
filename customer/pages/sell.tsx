import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Layout from "../components/Layout";
import { useSellFlow } from "../hooks/useSellFlow";
import ListItemModal, { type ListingMode } from "../components/listing/ListItemModal";
import { getProgram } from "../lib/anchor";
import { fetchOwnedVaultItems, type VaultItem } from "../lib/fetchOwnedItems";
import {
  SellPageHero,
  SellDeviceStatus,
  SellStepForm,
  SellStepValuation,
  SellStepShipping,
  SellStepComplete,
  SellFlashcards,
  SellNftMintPreview,
  SellLanding,
  SellStepProgress,
} from "../components/sell";
import type { SellMintStage } from "../lib/sell/nftPreview";
import type { SellMode } from "../lib/sell/sellModes";

function sellMintStage(pawnStep: string): SellMintStage {
  if (pawnStep === "val") return "valued";
  if (pawnStep === "shipping") return "shipping";
  if (pawnStep === "complete") return "minted";
  return "draft";
}

export default function SellEwaste() {
  const router = useRouter();
  const flow = useSellFlow();
  const wallet = useWallet();
  const { connection } = useConnection();
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [listItem, setListItem] = useState<VaultItem | null>(null);
  const [listMode, setListMode] = useState<ListingMode>("fixed");

  useEffect(() => {
    if (!wallet.connected || !wallet.publicKey) {
      setVaultItems([]);
      return;
    }
    const program = getProgram(wallet, connection);
    fetchOwnedVaultItems(program, connection, wallet.publicKey)
      .then(setVaultItems)
      .catch(console.error);
  }, [wallet.connected, wallet.publicKey, connection]);

  const handleSelectMode = (mode: SellMode) => {
    if (mode === "list" || mode === "auction") {
      const listable = vaultItems.filter((i) => i.status === 0);
      if (wallet.connected && listable.length > 0) {
        setListItem(listable[0]);
        setListMode(mode === "auction" ? "auction" : "fixed");
        return;
      }
      flow.beginIntakeFromList(mode);
      return;
    }
    flow.startMode(mode);
  };

  const inBrowseMode = flow.pawnStep === "landing";
  const inFlashcards = flow.pawnStep === "flashcards";
  const inActiveFlow = ["form", "val", "shipping", "complete"].includes(flow.pawnStep);
  const inSellFlow = inFlashcards || inActiveFlow;
  const mintStage = sellMintStage(flow.pawnStep);

  return (
    <Layout wide>
      <div className={`mx-auto ${inBrowseMode ? "max-w-5xl" : inSellFlow ? "max-w-6xl" : "max-w-4xl"}`}>
        <SellPageHero
          compact={inFlashcards || inActiveFlow}
          sellMode={flow.sellMode}
          pawnStep={flow.pawnStep}
        />

        {inSellFlow && <SellStepProgress pawnStep={flow.pawnStep} />}

        {flow.intakeBanner && (
          <div className="sell-intake-banner" role="status">
            <p>{flow.intakeBanner}</p>
          </div>
        )}

        {inBrowseMode && <SellLanding onSelectMode={handleSelectMode} />}

        {listItem && (
          <ListItemModal
            item={listItem}
            initialMode={listMode}
            onClose={() => {
              setListItem(null);
            }}
            onListed={(mode) => {
              setListItem(null);
              if (mode === "auction") {
                router.push("/auctions");
              } else {
                router.push("/market");
              }
            }}
          />
        )}

        {inFlashcards && (
          <div className="sell-flow-layout">
            <div className="sell-flow-layout__main">
              <SellDeviceStatus
                form={flow.form}
                updateForm={flow.updateForm}
                onCompleteChange={flow.setDeviceStatusComplete}
              />
              <SellFlashcards
                questions={flow.bubbleQuestions}
                answers={flow.bubbleAnswers}
                onAnswer={flow.answerBubble}
                onComplete={flow.completeFlashcards}
                onBack={flow.backToLanding}
                disabled={!flow.deviceStatusComplete}
              />
            </div>
            <aside className="sell-flow-layout__aside">
              <SellNftMintPreview form={flow.form} stage="draft" compact />
            </aside>
          </div>
        )}

        {inActiveFlow && (
          <div className="sell-flow-layout">
            <div className="sell-flow-layout__main">
              {flow.pawnStep === "form" && (
                <SellStepForm
                  form={flow.form}
                  autoDetectMsg={flow.autoDetectMsg}
                  updateForm={flow.updateForm}
                  runQuantumAutoDetect={flow.runQuantumAutoDetect}
                  onContinue={flow.goToValuation}
                  deviceStatusComplete={flow.deviceStatusComplete}
                  onDeviceStatusCompleteChange={flow.setDeviceStatusComplete}
                />
              )}

              {(flow.pawnStep === "val" || flow.showVal) && flow.valuation && (
                <SellStepValuation
                  form={flow.form}
                  valuation={flow.valuation}
                  boostEnabled={flow.boostEnabled}
                  boostPercent={flow.boostPercent}
                  grokRec={flow.grokRec}
                  onBack={flow.goBackToForm}
                  onAccept={flow.acceptPawn}
                  toggleBoost={flow.toggleBoost}
                  setBoostPercent={flow.setBoostPercent}
                  setGrokRec={flow.setGrokRec}
                  applyGrokRec={flow.applyGrokRec}
                  handleNeuroDecide={flow.handleNeuroDecide}
                  computeBoostPreview={flow.computeBoostPreview}
                />
              )}

              {flow.pawnStep === "shipping" && (
                <SellStepShipping
                  form={flow.form}
                  valuation={flow.valuation}
                  shipAddress={flow.shipAddress}
                  shippingProgress={flow.shippingProgress}
                  currentShipStep={flow.currentShipStep}
                  tracking={flow.tracking}
                  is3DAnimating={flow.is3DAnimating}
                  optimizedRouteIndex={flow.optimizedRouteIndex}
                  onShipAddressChange={flow.onShipAddressChange}
                  onStartSim={flow.startShippingSim}
                  onRunAiOptimizer={flow.runAiOptimizer}
                  onSelectRoute={flow.selectRoute}
                  onChainPawnStatus={flow.onChainPawnStatus}
                  onChainPawnBlockers={flow.onChainPawnBlockers}
                />
              )}

              {flow.pawnStep === "complete" && (
                <SellStepComplete
                  tracking={flow.tracking}
                  valuation={flow.valuation}
                  form={flow.form}
                  onReset={flow.resetAll}
                />
              )}
            </div>

            <aside className="sell-flow-layout__aside">
              <SellNftMintPreview
                form={flow.form}
                stage={mintStage}
                offerUsd={flow.valuation?.offerUsd}
                boostEnabled={flow.boostEnabled}
                boostPercent={flow.boostPercent}
              />
            </aside>
          </div>
        )}

        {(inBrowseMode || inFlashcards) && (
          <p className="text-center text-[10px] text-gray-600 mt-10">
            Physical items only. ID verification on high-value actions. Optional mail-in recycling is in your profile.
          </p>
        )}
      </div>
    </Layout>
  );
}