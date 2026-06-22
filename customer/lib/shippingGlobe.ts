/** Lat/lon → unit sphere position (Y-up, standard geographic convention). */
export function latLonToVec3(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

export type ShippingHub = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  tier: "vault" | "major" | "regional";
};

export type LiveBuyer = {
  id: string;
  label: string;
  lat: number;
  lon: number;
  hubId: string;
  /** ms offset before pop-in */
  delayMs: number;
};

export const GLOBE_RADIUS = 2.15;

export const SHIPPING_HUBS: ShippingHub[] = [
  { id: "vault", name: "NFTBAY Vault · Austin", lat: 30.27, lon: -97.74, tier: "vault" },
  { id: "memphis", name: "Memphis Hub", lat: 35.15, lon: -90.05, tier: "major" },
  { id: "louisville", name: "Louisville Hub", lat: 38.25, lon: -85.76, tier: "major" },
  { id: "la", name: "Los Angeles Hub", lat: 34.05, lon: -118.24, tier: "major" },
  { id: "nyc", name: "New York Hub", lat: 40.71, lon: -74.01, tier: "major" },
  { id: "london", name: "London Hub", lat: 51.51, lon: -0.13, tier: "regional" },
  { id: "singapore", name: "Singapore Hub", lat: 1.35, lon: 103.82, tier: "regional" },
];

export const LIVE_BUYERS: LiveBuyer[] = [
  { id: "b1", label: "maya.sol", lat: 37.77, lon: -122.42, hubId: "la", delayMs: 400 },
  { id: "b2", label: "jaydan", lat: 30.27, lon: -97.74, hubId: "vault", delayMs: 900 },
  { id: "b3", label: "collector.nyc", lat: 40.73, lon: -73.99, hubId: "nyc", delayMs: 1400 },
  { id: "b4", label: "gameon.eth", lat: 47.61, lon: -122.33, hubId: "la", delayMs: 1900 },
  { id: "b5", label: "vault_buyer", lat: 41.88, lon: -87.63, hubId: "memphis", delayMs: 2400 },
  { id: "b6", label: "shutter.sol", lat: 51.51, lon: -0.12, hubId: "london", delayMs: 2900 },
  { id: "b7", label: "audio_fan", lat: 25.76, lon: -80.19, hubId: "memphis", delayMs: 3400 },
  { id: "b8", label: "fit_track", lat: 1.29, lon: 103.85, hubId: "singapore", delayMs: 3900 },
  { id: "b9", label: "degen.au", lat: -33.87, lon: 151.21, hubId: "singapore", delayMs: 4400 },
  { id: "b10", label: "pawn.pro", lat: 39.74, lon: -104.99, hubId: "louisville", delayMs: 4900 },
];

/** Simple continent patches as lat/lon ellipses for grey landmass hints. */
export const CONTINENT_PATCHES: { lat: number; lon: number; scale: [number, number, number]; rot?: number }[] = [
  { lat: 45, lon: -100, scale: [1.1, 0.55, 0.35] },
  { lat: 38, lon: -95, scale: [0.7, 0.4, 0.3] },
  { lat: 55, lon: -105, scale: [0.85, 0.45, 0.28] },
  { lat: 50, lon: 10, scale: [0.55, 0.35, 0.25] },
  { lat: 48, lon: 25, scale: [0.5, 0.3, 0.22] },
  { lat: -15, lon: -55, scale: [0.65, 0.5, 0.3] },
  { lat: 5, lon: 20, scale: [0.6, 0.45, 0.28] },
  { lat: -25, lon: 135, scale: [0.55, 0.38, 0.26] },
  { lat: 35, lon: 105, scale: [0.9, 0.5, 0.32] },
  { lat: 65, lon: 90, scale: [1.2, 0.4, 0.35] },
];