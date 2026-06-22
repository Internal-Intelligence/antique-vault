import { useState, useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Html } from "@react-three/drei";
import {
  GLOBE_RADIUS,
  SHIPPING_HUBS,
  LIVE_BUYERS,
  CONTINENT_PATCHES,
  latLonToVec3,
  type ShippingHub,
  type LiveBuyer,
} from "../../lib/shippingGlobe";

interface QuantumShippingVizProps {
  animating: boolean;
  optimizedIndex: number | null;
  shipAddress: string;
  onOptimize: (idx: number) => void;
}

function buildArcPoints(
  from: [number, number, number],
  to: [number, number, number],
  lift = 0.42,
  segments = 40
): [number, number, number][] {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const points: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = new THREE.Vector3().lerpVectors(a, b, t);
    const bulge = Math.sin(t * Math.PI) * lift;
    p.normalize().multiplyScalar(p.length() + bulge);
    points.push([p.x, p.y, p.z]);
  }
  return points;
}

function GridGlobe() {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.08;
  });

  return (
    <group ref={groupRef}>
      {/* Core — dark glass sphere */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshPhysicalMaterial
          color="#0a0a0c"
          transparent
          opacity={0.55}
          roughness={0.85}
          metalness={0.15}
          clearcoat={0.2}
        />
      </mesh>

      {/* Latitude / longitude grid — see-through Shopify vibe */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 1.002, 48, 48]} />
        <meshBasicMaterial color="#5a5a62" wireframe transparent opacity={0.22} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <sphereGeometry args={[GLOBE_RADIUS * 1.004, 24, 24]} />
        <meshBasicMaterial color="#6b6b75" wireframe transparent opacity={0.12} />
      </mesh>

      {/* Light grey continent hints */}
      {CONTINENT_PATCHES.map((patch, i) => {
        const pos = latLonToVec3(patch.lat, patch.lon, GLOBE_RADIUS * 1.006);
        return (
          <mesh key={i} position={pos} scale={patch.scale}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshBasicMaterial color="#9ca3af" transparent opacity={0.22} />
          </mesh>
        );
      })}
    </group>
  );
}

function HubMarker({ hub, active }: { hub: ShippingHub; active: boolean }) {
  const pos = latLonToVec3(hub.lat, hub.lon, GLOBE_RADIUS);
  const normal = new THREE.Vector3(...pos).normalize();
  const offset = normal.clone().multiplyScalar(0.08);
  const display = pos.map((v, i) => v + [offset.x, offset.y, offset.z][i]) as [number, number, number];

  const scale = hub.tier === "vault" ? 0.22 : hub.tier === "major" ? 0.16 : 0.12;
  const color = hub.tier === "vault" ? "#a855f7" : "#7c3aed";

  const pulseRef = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (pulseRef.current && active) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.12;
      pulseRef.current.scale.setScalar(s);
    }
  });

  return (
    <group position={display}>
      <mesh ref={pulseRef}>
        <octahedronGeometry args={[scale, 0]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh scale={1.8}>
        <octahedronGeometry args={[scale, 0]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} wireframe />
      </mesh>
      {hub.tier === "vault" && (
        <mesh scale={2.4}>
          <ringGeometry args={[scale * 1.2, scale * 1.55, 32]} />
          <meshBasicMaterial color="#c084fc" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      )}
      <Html position={[0, scale + 0.18, 0]} style={{ pointerEvents: "none" }}>
        <div
          className={`text-[8px] font-semibold whitespace-nowrap px-1.5 py-0.5 rounded ${
            hub.tier === "vault" ? "text-purple-200 bg-purple-950/80" : "text-purple-300/70"
          }`}
        >
          {hub.name}
        </div>
      </Html>
    </group>
  );
}

function BuyerMarker({
  buyer,
  hubPos,
  visible,
  animating,
}: {
  buyer: LiveBuyer;
  hubPos: [number, number, number];
  visible: boolean;
  animating: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const pop = useRef(0);

  const pos = latLonToVec3(buyer.lat, buyer.lon, GLOBE_RADIUS);
  const normal = new THREE.Vector3(...pos).normalize();
  const offset = normal.clone().multiplyScalar(0.05);
  const display = pos.map((v, i) => v + [offset.x, offset.y, offset.z][i]) as [number, number, number];

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (visible) {
      pop.current = Math.min(1, pop.current + delta * 3.5);
    } else {
      pop.current = Math.max(0, pop.current - delta * 4);
    }
    const ease = 1 - Math.pow(1 - pop.current, 3);
    groupRef.current.scale.setScalar(ease);
    groupRef.current.visible = pop.current > 0.02;
  });

  const arcPoints = useMemo(() => buildArcPoints(hubPos, display, 0.38), [hubPos, display]);

  return (
    <>
      {visible && animating && (
        <StarlinkBeam points={arcPoints} active={pop.current > 0.5} />
      )}
      <group ref={groupRef} position={display} scale={0}>
        <mesh>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshBasicMaterial color="#ddd6fe" />
        </mesh>
        <mesh scale={1.6}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshBasicMaterial color="#c4b5fd" transparent opacity={0.25} />
        </mesh>
        <Html position={[0, 0.14, 0]} style={{ pointerEvents: "none" }}>
          <div className="text-[7px] text-violet-200/90 font-mono whitespace-nowrap bg-black/50 px-1 rounded">
            {buyer.label}
          </div>
        </Html>
      </group>
    </>
  );
}

function StarlinkBeam({
  points,
  active,
}: {
  points: [number, number, number][];
  active: boolean;
}) {
  const pulseRef = useRef<THREE.Group>(null!);
  const lineRef = useRef<any>(null!);

  useFrame((state) => {
    if (!active || !pulseRef.current) return;
    const t = (state.clock.elapsedTime * 1.4) % 1;
    const idx = Math.floor(t * (points.length - 1));
    const next = Math.min(idx + 1, points.length - 1);
    const local = (t * (points.length - 1)) % 1;
    const p0 = points[idx];
    const p1 = points[next];
    pulseRef.current.position.set(
      p0[0] + (p1[0] - p0[0]) * local,
      p0[1] + (p1[1] - p0[1]) * local,
      p0[2] + (p1[2] - p0[2]) * local
    );
    pulseRef.current.visible = true;
    if (lineRef.current?.material) {
      lineRef.current.material.opacity = 0.55 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
    }
  });

  return (
    <group>
      <Line
        ref={lineRef}
        points={points}
        color="#f8fafc"
        lineWidth={0.8}
        transparent
        opacity={0.45}
      />
      <Line points={points} color="#e9d5ff" lineWidth={0.35} transparent opacity={0.25} />
      <group ref={pulseRef} visible={false}>
        <mesh>
          <sphereGeometry args={[0.028]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh scale={2}>
          <sphereGeometry args={[0.028]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
        </mesh>
      </group>
    </group>
  );
}

function LiveGlobeScene({ animating }: { animating: boolean }) {
  const [visibleBuyers, setVisibleBuyers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!animating) {
      setVisibleBuyers(new Set());
      return;
    }
    const timers = LIVE_BUYERS.map((b) =>
      setTimeout(() => {
        setVisibleBuyers((prev) => new Set(prev).add(b.id));
      }, b.delayMs)
    );
    return () => timers.forEach(clearTimeout);
  }, [animating]);

  // Show a few buyers even when idle for the "live" feel
  useEffect(() => {
    if (animating) return;
    setVisibleBuyers(new Set(LIVE_BUYERS.slice(0, 4).map((b) => b.id)));
  }, [animating]);

  const hubPositions = useMemo(() => {
    const map: Record<string, [number, number, number]> = {};
    SHIPPING_HUBS.forEach((h) => {
      const p = latLonToVec3(h.lat, h.lon, GLOBE_RADIUS);
      const n = new THREE.Vector3(...p).normalize().multiplyScalar(0.06);
      map[h.id] = [p[0] + n.x, p[1] + n.y, p[2] + n.z];
    });
    return map;
  }, []);

  return (
    <>
      <color attach="background" args={["#050506"]} />
      <fog attach="fog" args={["#050506", 8, 22]} />
      <ambientLight intensity={0.25} />
      <pointLight position={[6, 8, 4]} intensity={0.6} color="#a78bfa" />
      <pointLight position={[-5, -3, -6]} intensity={0.35} color="#64748b" />

      <GridGlobe />

      {SHIPPING_HUBS.map((hub) => (
        <HubMarker key={hub.id} hub={hub} active={animating || hub.tier === "vault"} />
      ))}

      {LIVE_BUYERS.map((buyer) => (
        <BuyerMarker
          key={buyer.id}
          buyer={buyer}
          hubPos={hubPositions[buyer.hubId] ?? hubPositions.vault}
          visible={visibleBuyers.has(buyer.id)}
          animating={animating}
        />
      ))}
    </>
  );
}

function ShippingGlobeCanvas({ animating }: { animating: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 1.2, 6.8], fov: 42 }}
      gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
    >
      <LiveGlobeScene animating={animating} />
    </Canvas>
  );
}

export default function QuantumShippingViz({
  animating,
  optimizedIndex,
  shipAddress,
  onOptimize,
}: QuantumShippingVizProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const liveCount = animating ? LIVE_BUYERS.length : 4;

  if (!mounted) {
    return (
      <div className="h-[420px] w-full rounded-2xl bg-[#050506] border border-white/10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-purple-300 text-xs tracking-[3px] mb-1">LIVE TRACKING</div>
          <div className="animate-pulse text-white/50 text-[10px]">Initializing global mesh…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[420px] w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#050506]">
      <ShippingGlobeCanvas animating={animating} />
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
        <span className="sell-live-dot text-[10px]">
          <span className="sell-live-pulse" />
          Live
        </span>
        <span className="text-[9px] text-zinc-500 tracking-widest uppercase">Global shipment mesh</span>
      </div>
      <div className="absolute top-3 right-3 text-[9px] px-2 py-1 rounded bg-purple-950/70 border border-purple-500/30 text-purple-200 pointer-events-none">
        {liveCount} buyers linked
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end pointer-events-none">
        <div className="text-[9px] text-zinc-600 max-w-[55%]">
          Purple hubs · light violet buyers · Starlink beams
          {shipAddress ? ` · route from ${shipAddress.split(",")[0]}` : ""}
        </div>
        <div className="flex gap-1">
          {["Hub", "Buyer", "Laser"].map((l) => (
            <span key={l} className="text-[8px] px-1.5 py-0.5 rounded border border-white/10 text-zinc-500">
              {l}
            </span>
          ))}
        </div>
      </div>
      {optimizedIndex !== null && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] text-purple-300 pointer-events-none">
          AI route optimized
        </div>
      )}
    </div>
  );
}