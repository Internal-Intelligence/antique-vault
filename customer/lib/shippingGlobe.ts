import * as THREE from "three";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function normalize3(v: [number, number, number]): [number, number, number] {
  const len = Math.hypot(v[0], v[1], v[2]);
  if (len < 1e-9) return [0, 1, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

/** Great-circle arc hugging the globe — slerp on unit sphere + altitude bulge. */
export function buildGeodesicArc(
  from: [number, number, number],
  to: [number, number, number],
  segments = 48,
  lift = 0.35
): [number, number, number][] {
  const rA = Math.hypot(from[0], from[1], from[2]);
  const rB = Math.hypot(to[0], to[1], to[2]);
  const start = normalize3(from);
  const end = normalize3(to);
  const dot = clamp(start[0] * end[0] + start[1] * end[1] + start[2] * end[2], -1, 1);
  const omega = Math.acos(dot);
  const points: [number, number, number][] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    let dir: [number, number, number];
    if (omega < 1e-6) {
      dir = start;
    } else {
      const sinOmega = Math.sin(omega);
      const w1 = Math.sin((1 - t) * omega) / sinOmega;
      const w2 = Math.sin(t * omega) / sinOmega;
      dir = [
        start[0] * w1 + end[0] * w2,
        start[1] * w1 + end[1] * w2,
        start[2] * w1 + end[2] * w2,
      ];
    }
    const baseR = rA + (rB - rA) * t;
    const bulge = Math.sin(t * Math.PI) * lift;
    const r = baseR + bulge;
    points.push([dir[0] * r, dir[1] * r, dir[2] * r]);
  }
  return points;
}

/** Geodesic arc from lat/lon endpoints, lifted slightly above globe surface. */
export function buildGeodesicArcLatLon(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  radius = GLOBE_RADIUS,
  surfaceLift = 0.06,
  lift = 0.35,
  segments = 48
): [number, number, number][] {
  const from = latLonToVec3(fromLat, fromLon, radius + surfaceLift);
  const to = latLonToVec3(toLat, toLon, radius + surfaceLift);
  return buildGeodesicArc(from, to, segments, lift);
}

export const BUYER_ORIGIN_COLOR = "#c4b5fd";
export const OPTIMIZED_ROUTE_COLOR = "#22ffaa";
export const VAULT_HUB_COLOR = "#c084fc";

/** Lat/lon origins for ROUTE_OPTIONS[i] — seller ship-from cities. */
export const ROUTE_ORIGIN_COORDS: { lat: number; lon: number; label: string }[] = [
  { lat: 30.27, lon: -97.74, label: "Austin, TX" },
  { lat: 34.05, lon: -118.24, label: "Los Angeles, CA" },
  { lat: 40.71, lon: -74.01, label: "New York, NY" },
  { lat: 41.88, lon: -87.63, label: "Chicago, IL" },
  { lat: 47.61, lon: -122.33, label: "Seattle, WA" },
  { lat: 25.76, lon: -80.19, label: "Miami, FL" },
];

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

export type HubTierStyle = {
  color: string;
  accent: string;
  glow: string;
  pillarHeight: number;
  pillarRadius: number;
  headRadius: number;
  label: string;
  shortLabel: string;
};

export const HUB_TIER_STYLES: Record<ShippingHub["tier"], HubTierStyle> = {
  vault: {
    color: "#fbbf24",
    accent: "#a855f7",
    glow: "#c084fc",
    pillarHeight: 0.38,
    pillarRadius: 0.045,
    headRadius: 0.09,
    label: "NFTBAY VAULT",
    shortLabel: "Austin",
  },
  major: {
    color: "#3b82f6",
    accent: "#60a5fa",
    glow: "#93c5fd",
    pillarHeight: 0.24,
    pillarRadius: 0.032,
    headRadius: 0.058,
    label: "",
    shortLabel: "",
  },
  regional: {
    color: "#14b8a6",
    accent: "#2dd4bf",
    glow: "#5eead4",
    pillarHeight: 0.17,
    pillarRadius: 0.026,
    headRadius: 0.044,
    label: "",
    shortLabel: "",
  },
};

/** Arc / beam destination color per hub tier. */
export function hubColor(tier: ShippingHub["tier"]): string {
  return HUB_TIER_STYLES[tier].glow;
}

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

/** Simplified continent outlines as [lon, lat] rings (equirectangular source). */
const LAND_MASSES: [number, number][][] = [
  // North America
  [
    [-168, 65], [-152, 61], [-135, 56], [-125, 49], [-124, 42], [-117, 33], [-105, 28], [-97, 26],
    [-82, 25], [-80, 30], [-75, 35], [-67, 45], [-60, 47], [-64, 52], [-75, 58], [-95, 70],
    [-120, 72], [-140, 70], [-168, 65],
  ],
  // Central America & Caribbean
  [[-105, 22], [-97, 18], [-88, 15], [-82, 10], [-88, 8], [-95, 12], [-105, 22]],
  // Greenland
  [[-52, 60], [-42, 64], [-22, 72], [-30, 78], [-48, 76], [-58, 70], [-52, 60]],
  // South America
  [
    [-80, 10], [-75, 4], [-70, -5], [-65, -15], [-58, -25], [-52, -35], [-58, -50], [-65, -55],
    [-72, -52], [-75, -40], [-72, -20], [-78, -5], [-80, 5], [-80, 10],
  ],
  // Europe
  [[-10, 36], [0, 38], [10, 42], [20, 40], [28, 42], [30, 45], [25, 55], [15, 58], [5, 62], [-5, 58], [-10, 50], [-10, 36]],
  // British Isles
  [[-5, 50], [0, 52], [2, 58], [-3, 58], [-5, 50]],
  // Africa
  [
    [-17, 35], [0, 37], [10, 37], [25, 32], [40, 12], [50, 5], [42, -5], [35, -15], [25, -35], [18, -35],
    [12, 5], [0, 5], [-10, 5], [-17, 15], [-17, 35],
  ],
  // Middle East
  [[25, 32], [35, 30], [45, 28], [52, 24], [58, 22], [55, 12], [45, 12], [35, 15], [25, 22], [25, 32]],
  // Asia (main)
  [
    [25, 40], [45, 40], [60, 35], [80, 30], [100, 20], [120, 25], [130, 35], [140, 45], [145, 50],
    [130, 60], [100, 65], [80, 70], [60, 68], [40, 55], [25, 45], [25, 40],
  ],
  // India
  [[68, 8], [80, 8], [88, 22], [80, 28], [72, 22], [68, 8]],
  // Southeast Asia
  [[95, 10], [105, 5], [110, 15], [100, 22], [95, 10]],
  // Japan
  [[130, 32], [138, 34], [142, 40], [135, 42], [130, 32]],
  // Indonesia / Papua
  [[105, -2], [115, -5], [130, -3], [140, -6], [135, -10], [120, -8], [105, -2]],
  // Australia
  [[115, -22], [130, -12], [145, -18], [150, -28], [140, -38], [125, -38], [115, -32], [115, -22]],
  // New Zealand
  [[166, -35], [174, -38], [178, -42], [172, -46], [166, -35]],
  // Antarctica (subtle southern band)
  [[-180, -60], [180, -60], [180, -78], [-180, -78], [-180, -60]],
];

const EARTH_TEX_W = 512;
const EARTH_TEX_H = 256;

const OCEAN_COLOR = "#081a2e";
const LAND_FILL = "#6d8f74";
const LAND_HIGHLIGHT = "#8aa88e";
const COAST_LINE = "#a8c4a4";

function lonLatToCanvas(lon: number, lat: number, w: number, h: number): [number, number] {
  return [((lon + 180) / 360) * w, ((90 - lat) / 180) * h];
}

function drawLandMass(ctx: CanvasRenderingContext2D, ring: [number, number][], w: number, h: number) {
  ctx.beginPath();
  ring.forEach(([lon, lat], i) => {
    const [x, y] = lonLatToCanvas(lon, lat, w, h);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function buildEarthCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = EARTH_TEX_W;
  canvas.height = EARTH_TEX_H;
  const ctx = canvas.getContext("2d")!;

  // Ocean base
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, EARTH_TEX_H);
  oceanGrad.addColorStop(0, "#0a2240");
  oceanGrad.addColorStop(0.5, OCEAN_COLOR);
  oceanGrad.addColorStop(1, "#061220");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, EARTH_TEX_W, EARTH_TEX_H);

  // Land fill with subtle variation
  ctx.fillStyle = LAND_FILL;
  ctx.strokeStyle = COAST_LINE;
  ctx.lineWidth = 1.25;
  ctx.lineJoin = "round";

  for (const ring of LAND_MASSES) {
    drawLandMass(ctx, ring, EARTH_TEX_W, EARTH_TEX_H);
  }

  // Inland highlight dots for country/coast readability at globe zoom
  ctx.fillStyle = LAND_HIGHLIGHT;
  for (const ring of LAND_MASSES) {
    for (let i = 0; i < ring.length; i += 2) {
      const [lon, lat] = ring[i];
      const [x, y] = lonLatToCanvas(lon, lat, EARTH_TEX_W, EARTH_TEX_H);
      ctx.beginPath();
      ctx.arc(x, y, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return canvas;
}

function buildEarthBumpCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = EARTH_TEX_W;
  canvas.height = EARTH_TEX_H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, EARTH_TEX_W, EARTH_TEX_H);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 1;

  for (const ring of LAND_MASSES) {
    drawLandMass(ctx, ring, EARTH_TEX_W, EARTH_TEX_H);
  }

  return canvas;
}

export type EarthTextures = {
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
};

/** Procedural stylized Earth textures — dark ocean, grey-green land, no network fetch. */
export function createEarthTextures(): EarthTextures {
  const colorMap = new THREE.CanvasTexture(buildEarthCanvas());
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.anisotropy = 4;
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.ClampToEdgeWrapping;
  colorMap.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(buildEarthBumpCanvas());
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.needsUpdate = true;

  return { colorMap, bumpMap };
}

export function disposeEarthTextures(textures: EarthTextures) {
  textures.colorMap.dispose();
  textures.bumpMap.dispose();
}