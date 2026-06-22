import Layout from "../components/Layout";
import { useSellFlow } from "../hooks/useSellFlow";
import {
  SellPageHero,
  SellWorkingToggle,
  SellStepForm,
  SellStepValuation,
  SellStepShipping,
  SellStepComplete,
} from "../components/sell";

export default function SellEwaste() {
  const flow = useSellFlow();

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <SellPageHero />
        <SellWorkingToggle form={flow.form} updateForm={flow.updateForm} />

        {flow.pawnStep === "form" && (
          <SellStepForm
            form={flow.form}
            bubbleQuestions={flow.bubbleQuestions}
            bubbleAnswers={flow.bubbleAnswers}
            autoDetectMsg={flow.autoDetectMsg}
            updateForm={flow.updateForm}
            answerBubble={flow.answerBubble}
            runQuantumAutoDetect={flow.runQuantumAutoDetect}
            onContinue={flow.goToValuation}
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

        <p className="text-center text-[10px] text-gray-600 mt-10">
          Physical items only. ID verification on high-value actions. Optional mail-in recycling is available in your profile.
        </p>
      </div>
    </Layout>
  );
}