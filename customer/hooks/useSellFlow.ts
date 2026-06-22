import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { CATEGORIES, requireIdVerification, simulateIdVerificationGate, predictEwasteQuantum } from "../lib/anchor";
import { attemptMailInPawnIntake } from "../lib/nftbay";
import {
  computeQuantumValuation,
  computeBoostPreview,
  getNeuroGrokRec,
  neurochipDecideBoost,
  createBubbleQuestions,
  SHIPPING_SIM_STEPS,
  type PawnForm,
  type PawnStep,
  type Valuation,
  type BubbleQuestion,
  type SellFlowState,
} from "../lib/sell";

const DEFAULT_FORM: PawnForm = {
  deviceName: "",
  category: CATEGORIES[0],
  isWorking: true,
  condition: 3,
  weightLbs: "2.8",
  description: "",
};

export interface SellFlowActions {
  updateForm: <K extends keyof PawnForm>(key: K, val: PawnForm[K]) => void;
  answerBubble: (qKey: string, opt: string, onSelect: (v: string) => void) => void;
  runQuantumAutoDetect: () => void;
  acceptPawn: () => void | Promise<void>;
  startShippingSim: () => void;
  resetAll: () => void;
  applyGrokRec: () => void;
  handleNeuroDecide: (currentOffer?: number) => void;
  goToValuation: () => void;
  startFlashcards: () => void;
  completeFlashcards: () => void;
  backToLanding: () => void;
  /** Alias used by SellStepForm */
  onContinue: () => void;
  goBackToForm: () => void;
  /** Alias for goBackToForm */
  backToForm: () => void;
  setShowVal: (show: boolean) => void;
  setPawnStep: (step: PawnStep) => void;
  setShipAddress: (address: string) => void;
  setBoostEnabled: (enabled: boolean) => void;
  setBoostPercent: (percent: number) => void;
  setGrokRec: (rec: string) => void;
  setIs3DAnimating: (animating: boolean) => void;
  setOptimizedRouteIndex: (index: number | null) => void;
  toggleBoost: () => void;
  runAiOptimizer: () => void;
  selectRoute: (idx: number) => void;
  onShipAddressChange: (value: string) => void;
  onChainPawnStatus: string | null;
  onChainPawnBlockers: string[];
}

export type UseSellFlowReturn = SellFlowState & {
  /** Live valuation alias for convenience */
  val: Valuation | null;
  bubbleQuestions: BubbleQuestion[];
  computeBoostPreview: typeof computeBoostPreview;
} & SellFlowActions;

export function useSellFlow(): UseSellFlowReturn {
  const router = useRouter();
  const wallet = useWallet();
  const { connection } = useConnection();
  const [form, setForm] = useState<PawnForm>(DEFAULT_FORM);
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const [showVal, setShowVal] = useState(false);
  const [pawnStep, setPawnStep] = useState<PawnStep>("landing");
  const [shippingProgress, setShippingProgress] = useState(0);
  const [currentShipStep, setCurrentShipStep] = useState(0);
  const [tracking, setTracking] = useState("");
  const [shipAddress, setShipAddress] = useState("");
  const [bubbleAnswers, setBubbleAnswers] = useState<Record<string, string>>({});
  const [autoDetectMsg, setAutoDetectMsg] = useState("");
  const [is3DAnimating, setIs3DAnimating] = useState(false);
  const [optimizedRouteIndex, setOptimizedRouteIndex] = useState<number | null>(null);
  const [boostEnabled, setBoostEnabled] = useState(false);
  const [boostPercent, setBoostPercent] = useState(8);
  const [grokRec, setGrokRec] = useState("");
  const [onChainPawnStatus, setOnChainPawnStatus] = useState<string | null>(null);
  const [onChainPawnBlockers, setOnChainPawnBlockers] = useState<string[]>([]);

  const val = valuation;

  useEffect(() => {
    if (!router.isReady || router.query.program !== "ewaste-mailin") return;
    setPawnStep("flashcards");
    setForm((prev) => ({
      ...prev,
      category: "Other E-Waste",
      description:
        prev.description || "Mail-in e-waste bundle — phones, laptops, cables, small electronics under 15 lbs",
      weightLbs: prev.weightLbs === DEFAULT_FORM.weightLbs ? "5" : prev.weightLbs,
      isWorking: false,
    }));
  }, [router.isReady, router.query.program]);

  const updateForm = useCallback(<K extends keyof PawnForm>(key: K, val: PawnForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  }, []);

  const bubbleQuestions = useMemo(() => createBubbleQuestions(updateForm), [updateForm]);

  const handleNeuroDecide = useCallback(
    (currentOffer = 12) => {
      const decided = neurochipDecideBoost(currentOffer, boostEnabled);
      setBoostPercent(decided);
      setGrokRec(`Neurochip + Grok: optimal ${decided}% for max loop volume on this ${form.category}`);
    },
    [boostEnabled, form.category]
  );

  // Quantum intelligence: live auto-detection + smart categorization
  useEffect(() => {
    const name = form.deviceName.toLowerCase();
    const desc = form.description.toLowerCase();
    const text = `${name} ${desc}`;

    let detectedCat = form.category;
    let detectedWorking = form.isWorking;
    let detectNote = "";

    const catMap: Record<string, string> = {
      iphone: "Smartphones",
      samsung: "Smartphones",
      pixel: "Smartphones",
      phone: "Smartphones",
      macbook: "Laptops",
      dell: "Laptops",
      laptop: "Laptops",
      thinkpad: "Laptops",
      ipad: "Tablets",
      tablet: "Tablets",
      kindle: "Tablets",
      airpods: "Headphones & Audio",
      sony: "Headphones & Audio",
      headphones: "Headphones & Audio",
      earbuds: "Headphones & Audio",
      applewatch: "Wearables",
      watch: "Wearables",
      fitbit: "Wearables",
      ps5: "Gaming Devices",
      xbox: "Gaming Devices",
      nintendo: "Gaming Devices",
      switch: "Gaming Devices",
      canon: "Cameras",
      nikon: "Cameras",
      gopro: "Cameras",
      charger: "Chargers & Cables",
      cable: "Chargers & Cables",
      blender: "Small Appliances",
      toaster: "Small Appliances",
      microwave: "Small Appliances",
    };

    for (const [kw, cat] of Object.entries(catMap)) {
      if (text.includes(kw)) {
        detectedCat = cat;
        detectNote = `Quantum auto-categorized as ${cat}`;
        break;
      }
    }

    if (text.match(/broken|dead|cracked|not (power|turn|work|charge)|shattered|water|fried|won't|no power|faulty/)) {
      detectedWorking = false;
      detectNote = (detectNote ? detectNote + " • " : "") + "Non-working detected";
    } else if (text.match(/works|working|powers|excellent|mint|good/)) {
      detectedWorking = true;
    }

    if (detectedCat !== form.category || detectedWorking !== form.isWorking) {
      setForm((prev) => ({
        ...prev,
        category: detectedCat,
        isWorking: detectedWorking,
      }));
      setAutoDetectMsg(detectNote || "Quantum scan active");
      setTimeout(() => setAutoDetectMsg(""), 1800);
    }
  }, [form.deviceName, form.description]);

  // Deep AI valuation integration: recompute live on any change
  useEffect(() => {
    setValuation(computeQuantumValuation(form));
  }, [form]);

  const applyGrokRec = useCallback(() => {
    const rec = getNeuroGrokRec(form.deviceName, form.category, form.isWorking, form.condition);
    setBoostPercent(rec);
    setBoostEnabled(true);
    const insight = `Neuro/Grok recommends ${rec}% for this ${form.category} (${form.isWorking ? "WORKING" : "NON-WORKING"}). Higher visibility = faster sale. Golden loop active.`;
    setGrokRec(insight);
    setTimeout(() => setGrokRec(insight + " [Collaborated with Agent 7/9]"), 400);
    handleNeuroDecide(valuation?.offerUsd || 12);
  }, [form, valuation?.offerUsd, handleNeuroDecide]);

  const answerBubble = useCallback((qKey: string, opt: string, onSelect: (v: string) => void) => {
    setBubbleAnswers((prev) => ({ ...prev, [qKey]: opt }));
    onSelect(opt);
  }, []);

  const runQuantumAutoDetect = useCallback(() => {
    setAutoDetectMsg("Scanning with Quantum Vision Net...");
    setTimeout(async () => {
      const simCats = [...CATEGORIES];
      const randCat = simCats[Math.floor(Math.random() * simCats.length)];
      const newWorking = Math.random() > 0.38;
      updateForm("category", randCat);
      updateForm("isWorking", newWorking);
      updateForm("condition", newWorking ? 4 : 1);
      try {
        const ai = await predictEwasteQuantum(null, form.deviceName || randCat, randCat);
        console.log("[AI INTAKE ENHANCED]", ai);
      } catch {}
      setAutoDetectMsg(
        "Auto-detected via quantum scan • " + randCat + (newWorking ? " (WORKING)" : " (NON-WORKING)")
      );
      setTimeout(() => setAutoDetectMsg(""), 2400);
    }, 620);
  }, [form.deviceName, updateForm]);

  const acceptPawn = useCallback(async () => {
    if (!valuation) return;
    requireIdVerification("sell-pawn-" + form.deviceName, "pawn-accept");
    const gate = simulateIdVerificationGate("sell-e-waste", "AI-intake");
    console.log("[QUANTUM AI INTAKE ENHANCED]", gate);

    const address = shipAddress.trim() || "Austin, TX • Quantum Hub";
    if (!shipAddress.trim()) setShipAddress(address);

    const intake = await attemptMailInPawnIntake(wallet, connection, {
      deviceName: form.deviceName || form.category,
      category: form.category,
      offerUsdCents: Math.round(valuation.offerUsd * 100),
      shipAddress: address,
      isWorking: form.isWorking,
    });
    setOnChainPawnStatus(intake.message);
    setOnChainPawnBlockers(intake.blockers);
    console.log("[NFTBAY MAIL-IN PAWN]", intake);

    if (!intake.success) {
      console.info(
        "[NFTBAY] On-chain path blocked — required after vault mint:",
        "wallet + NFT mint → submitAiPawnOffer → createPawnPosition"
      );
    }

    setPawnStep("shipping");
    setShippingProgress(0);
    setCurrentShipStep(0);
    setIs3DAnimating(true);
    setOptimizedRouteIndex(null);
    const track = "QNTM-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-QUANTUM";
    setTracking(track);
  }, [valuation, form.deviceName, form.category, form.isWorking, shipAddress, wallet, connection]);

  const startShippingSim = useCallback(() => {
    if (!shipAddress.trim()) {
      alert("Enter a ship-from address to start quantum transit sim.");
      return;
    }
    setShippingProgress(5);
    setCurrentShipStep(0);
    setIs3DAnimating(true);
    setOptimizedRouteIndex(Math.floor(Math.random() * 5));

    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (idx < SHIPPING_SIM_STEPS.length) {
        setCurrentShipStep(idx);
        setShippingProgress(SHIPPING_SIM_STEPS[idx].progress);
      } else {
        clearInterval(interval);
        setShippingProgress(100);
        setTimeout(() => {
          setPawnStep("complete");
          setIs3DAnimating(false);
        }, 650);
      }
    }, 680);
  }, [shipAddress]);

  const startFlashcards = useCallback(() => {
    setPawnStep("flashcards");
    setBubbleAnswers({});
  }, []);

  const completeFlashcards = useCallback(() => {
    setPawnStep("form");
  }, []);

  const backToLanding = useCallback(() => {
    setPawnStep("landing");
  }, []);

  const resetAll = useCallback(() => {
    setForm(DEFAULT_FORM);
    setBubbleAnswers({});
    setValuation(null);
    setShowVal(false);
    setPawnStep("landing");
    setShippingProgress(0);
    setCurrentShipStep(0);
    setTracking("");
    setShipAddress("");
    setAutoDetectMsg("");
    setIs3DAnimating(false);
    setOptimizedRouteIndex(null);
    setOnChainPawnStatus(null);
    setOnChainPawnBlockers([]);
  }, []);

  const goToValuation = useCallback(() => {
    setShowVal(true);
    setPawnStep("val");
  }, []);

  const goBackToForm = useCallback(() => {
    setPawnStep("form");
    setShowVal(false);
  }, []);

  const toggleBoost = useCallback(() => {
    setBoostEnabled((prev) => {
      const next = !prev;
      if (next && !grokRec) applyGrokRec();
      return next;
    });
  }, [grokRec, applyGrokRec]);

  const runAiOptimizer = useCallback(() => {
    setOptimizedRouteIndex(Math.floor(Math.random() * 6));
    setIs3DAnimating(true);
  }, []);

  const selectRoute = useCallback((idx: number) => {
    setOptimizedRouteIndex(idx);
    setIs3DAnimating(true);
  }, []);

  const onShipAddressChange = useCallback((value: string) => {
    setShipAddress(value);
    setIs3DAnimating((prev) => prev || true);
  }, []);

  return {
    form,
    valuation,
    showVal,
    pawnStep,
    shippingProgress,
    currentShipStep,
    tracking,
    shipAddress,
    bubbleAnswers,
    autoDetectMsg,
    is3DAnimating,
    optimizedRouteIndex,
    boostEnabled,
    boostPercent,
    grokRec,
    val,
    bubbleQuestions,
    computeBoostPreview,
    updateForm,
    answerBubble,
    runQuantumAutoDetect,
    acceptPawn,
    startShippingSim,
    resetAll,
    applyGrokRec,
    handleNeuroDecide,
    goToValuation,
    startFlashcards,
    completeFlashcards,
    backToLanding,
    onContinue: goToValuation,
    goBackToForm,
    backToForm: goBackToForm,
    setShowVal,
    setPawnStep,
    setShipAddress,
    setBoostEnabled,
    setBoostPercent,
    setGrokRec,
    setIs3DAnimating,
    setOptimizedRouteIndex,
    toggleBoost,
    runAiOptimizer,
    selectRoute,
    onShipAddressChange,
    onChainPawnStatus,
    onChainPawnBlockers,
  };
}