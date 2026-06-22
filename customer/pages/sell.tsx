import Layout from "../components/Layout";
import { useSellFlow } from "../hooks/useSellFlow";
import {
  SellPageHero,
  SellDeviceStatus,
  SellStepForm,
  SellStepValuation,
  SellStepShipping,
  SellStepComplete,
  SellFlashcards,
  SellRecentlySold,
  SellAuctionsPreview,
  SellStartCTA,
  SellNftMintPreview,
} from "../components/sell";
import type { SellMintStage } from "../lib/sell/nftPreview";

function sellMintStage(pawnStep: string): SellMintStage {
  if (pawnStep === "val") return "valued";
  if (pawnStep === "shipping") return "shipping";
  if (pawnStep === "complete") return "minted";
  return "draft";
}

export default function SellEwaste() {
  const flow = useSellFlow();
  const inBrowseMode = flow.pawnStep === "landing";
  const inFlashcards = flow.pawnStep === "flashcards";
  const inActiveFlow = ["form", "val", "shipping", "complete"].includes(flow.pawnStep);
  const inSellFlow = inFlashcards || inActiveFlow;
  const mintStage = sellMintStage(flow.pawnStep);

  return (
    <Layout wide>
      <div className={`mx-auto ${inSellFlow ? "max-w-6xl" : "max-w-4xl"}`}>
        <SellPageHero compact={inFlashcards || inActiveFlow} />

        {inBrowseMode && (
          <>
            <SellStartCTA onStart={flow.startFlashcards} />
            <SellRecentlySold />
            <SellAuctionsPreview />
          </>
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