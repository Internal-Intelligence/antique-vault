import { LIVE_ACTIVITY } from "../components/home/data";
import { LIVE_BUYERS, ROUTE_ORIGIN_COORDS, SHIPPING_HUBS, type LiveBuyer } from "./shippingGlobe";

export type GlobeActivityKind = "buy" | "sell" | "ship" | "pawn" | "list";

export type GlobeActivityEvent = {
  id: string;
  who: string;
  action: string;
  item: string;
  ago: string;
  lat: number;
  lon: number;
  hubId: string;
  kind: GlobeActivityKind;
};

/** Known handles → approximate city coords for globe focus. */
const HANDLE_COORDS: Record<string, { lat: number; lon: number; hubId: string }> = {
  "alex.sol": { lat: 37.77, lon: -122.42, hubId: "la" },
  "maya.eth": { lat: 37.77, lon: -122.42, hubId: "la" },
  "maya.sol": { lat: 37.77, lon: -122.42, hubId: "la" },
  vault_ops: { lat: 30.27, lon: -97.74, hubId: "vault" },
  jaydan: { lat: 30.27, lon: -97.74, hubId: "vault" },
  collector: { lat: 40.73, lon: -73.99, hubId: "nyc" },
  "collector.nyc": { lat: 40.73, lon: -73.99, hubId: "nyc" },
  "gameon.eth": { lat: 47.61, lon: -122.33, hubId: "la" },
  vault_buyer: { lat: 41.88, lon: -87.63, hubId: "memphis" },
  "shutter.sol": { lat: 51.51, lon: -0.12, hubId: "london" },
  audio_fan: { lat: 25.76, lon: -80.19, hubId: "memphis" },
  fit_track: { lat: 1.29, lon: 103.85, hubId: "singapore" },
  "degen.au": { lat: -33.87, lon: 151.21, hubId: "singapore" },
  "pawn.pro": { lat: 39.74, lon: -104.99, hubId: "louisville" },
};

function inferKind(action: string): GlobeActivityKind {
  const a = action.toLowerCase();
  if (a.includes("ship")) return "ship";
  if (a.includes("pawn")) return "pawn";
  if (a.includes("list")) return "list";
  if (a.includes("won") || a.includes("snag")) return "buy";
  return "buy";
}

function lookupCoords(who: string, index: number): { lat: number; lon: number; hubId: string } {
  if (HANDLE_COORDS[who]) return HANDLE_COORDS[who];
  const buyer = LIVE_BUYERS[index % LIVE_BUYERS.length];
  return { lat: buyer.lat, lon: buyer.lon, hubId: buyer.hubId };
}

export function buildGlobeActivityFeed(): GlobeActivityEvent[] {
  return LIVE_ACTIVITY.map((entry, i) => {
    const coords = lookupCoords(entry.who, i);
    return {
      id: `act-${i}`,
      who: entry.who,
      action: entry.action,
      item: entry.item,
      ago: entry.ago,
      lat: coords.lat,
      lon: coords.lon,
      hubId: coords.hubId,
      kind: inferKind(entry.action),
    };
  });
}

export function formatActivityLine(event: GlobeActivityEvent): string {
  return `${event.who} ${event.action} ${event.item} · ${event.ago} ago`;
}

export const GLOBE_NETWORK_STATS = {
  activeBuyers: LIVE_BUYERS.length,
  inTransit: Math.max(4, Math.floor(LIVE_BUYERS.length * 0.4)),
  hubCount: SHIPPING_HUBS.length,
  vaultLabel: "Austin vault",
};

/** Seller cities shipping inbound to vault — ambient home-mode routes. */
export const AMBIENT_INBOUND_ROUTES = ROUTE_ORIGIN_COORDS.slice(0, 5).map((r, i) => ({
  id: `inbound-${i}`,
  routeIndex: i,
  label: r.label,
  lat: r.lat,
  lon: r.lon,
}));

export function mergeLiveBuyersWithFeed(): LiveBuyer[] {
  const feed = buildGlobeActivityFeed();
  const fromFeed: LiveBuyer[] = feed.map((e, i) => ({
    id: e.id,
    label: e.who,
    lat: e.lat,
    lon: e.lon,
    hubId: e.hubId,
    delayMs: 200 + i * 350,
  }));
  const seen = new Set(fromFeed.map((b) => b.label));
  const extra = LIVE_BUYERS.filter((b) => !seen.has(b.label));
  return [...fromFeed, ...extra];
}