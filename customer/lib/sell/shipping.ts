import type { ShippingStep } from "./types";

export const SHIPPING_SIM_STEPS: ShippingStep[] = [
  { label: "PACKED", detail: "Eco-box sealed. Quantum label printed.", progress: 22 },
  { label: "QUANTUM ENTANGLED", detail: "Instant link to NFTBAY vault node. Speed: c.", progress: 58 },
  { label: "IN TRANSIT", detail: "Photonic routing engaged. <4min sim arrival.", progress: 81 },
  { label: "VAULT RECEIVED", detail: "AI auto-detection scan + condition verified.", progress: 100 },
];

export const SHIPPING_DISPLAY_STEPS = [
  { label: "1. PACKED AT ORIGIN", detailPrefix: "Device boxed. Eco-certified. Label: " },
  { label: "2. QUANTUM ENTANGLED TRANSIT", detail: "Photonic entanglement engaged • Speed: 186k mi/s sim" },
  { label: "3. IN TRANSIT", detail: "Routing via NFTBAY nodes. <4 simulated minutes." },
  { label: "4. VAULTED + AI SCAN", detail: "Auto-detected category + working status logged. Verified." },
];

export const ROUTE_OPTIONS = [
  { i: 0, o: "Austin, TX", c: "FEDEX PLANE", t: "0.6Q", s: "99.8" },
  { i: 1, o: "Los Angeles, CA", c: "UPS DRONE", t: "1.1Q", s: "98.4" },
  { i: 2, o: "New York, NY", c: "DHL PLANE", t: "0.9Q", s: "99.1" },
  { i: 3, o: "Chicago, IL", c: "QUANTUM TRUCK", t: "1.4Q", s: "97.7" },
  { i: 4, o: "Seattle, WA", c: "PRIME DRONE", t: "0.8Q", s: "99.5" },
  { i: 5, o: "Miami, FL", c: "VAULTWING PLANE", t: "1.0Q", s: "98.9" },
];