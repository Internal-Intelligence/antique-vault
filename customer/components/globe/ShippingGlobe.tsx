import { useState, useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Html, OrbitControls, Stars } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  GLOBE_RADIUS,
  SHIPPING_HUBS,
  LIVE_BUYERS,
  latLonToVec3,
  buildGeodesicArc,
  buildGeodesicArcLatLon,
  createEarthTextures,
  disposeEarthTextures,
  hubColor,
  HUB_TIER_STYLES,
  BUYER_ORIGIN_COLOR,
  OPTIMIZED_ROUTE_COLOR,
  VAULT_HUB_COLOR,
  ROUTE_ORIGIN_COORDS,
  type ShippingHub,
  type LiveBuyer,
} from "../../lib/shippingGlobe";
import {
  AMBIENT_INBOUND_ROUTES,
  buildGlobeActivityFeed,
  formatActivityLine,
  mergeLiveBuyersWithFeed,
  type GlobeActivityEvent,
} from "../../lib/globeActivity";
import GlobeOverlayHome from "./overlays/GlobeOverlayHome";

export type ShippingGlobeMode = "home" | "sell";

export interface ShippingGlobeProps {
  mode?: ShippingGlobeMode;
  animating?: boolean;
  optimizedIndex?: number | null;
  shipAddress?: string;
  onOptimize?: (idx: number) => void;
  height?: number;
  className?: string;
  /** Pause 3D updates when off-screen */
  active?: boolean;
  reducedMotion?: boolean;
}

function buildGradientColors(count: number, fromHex: string, toHex: string): THREE.Color[] {
  const from = new THREE.Color(fromHex);
  const to = new THREE.Color(toHex);
  return Array.from({ length: count }, (_, i) => {
    const t = count <= 1 ? 0 : i / (count - 1);
    return from.clone().lerp(to, t);
  });
}

function sliceArcByProgress(
  points: [number, number, number][],
  progress: number
): [number, number, number][] {
  if (progress >= 1) return points;
  const end = Math.max(2, Math.floor(progress * (points.length - 1)) + 1);
  return points.slice(0, end);
}

function arcTangentAt(points: [number, number, number][], t: number): THREE.Vector3 {
  const idx = Math.min(Math.floor(t * (points.length - 1)), points.length - 2);
  const local = (t * (points.length - 1)) % 1;
  const p0 = points[idx];
  const p1 = points[Math.min(idx + 1, points.length - 1)];
  return new THREE.Vector3(
    p1[0] - p0[0],
    p1[1] - p0[1],
    p1[2] - p0[2]
  ).normalize();
}

function positionAlongArc(points: [number, number, number][], t: number): THREE.Vector3 {
  const idx = Math.min(Math.floor(t * (points.length - 1)), points.length - 2);
  const local = (t * (points.length - 1)) % 1;
  const p0 = points[idx];
  const p1 = points[Math.min(idx + 1, points.length - 1)];
  return new THREE.Vector3(
    p0[0] + (p1[0] - p0[0]) * local,
    p0[1] + (p1[1] - p0[1]) * local,
    p0[2] + (p1[2] - p0[2]) * local
  );
}

const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 glowColor;
  uniform float intensity;
  uniform float power;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), power);
    gl_FragColor = vec4(glowColor, fresnel * intensity);
  }
`;

class AtmosphereMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        glowColor: { value: new THREE.Color("#5b9fd4") },
        intensity: { value: 0.55 },
        power: { value: 2.8 },
      },
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
  }
}

function SpaceBackdrop({ lite = false }: { lite?: boolean }) {
  if (lite) {
    return <Stars radius={100} depth={50} count={1800} factor={3} saturation={0.12} fade speed={0.3} />;
  }
  return (
    <>
      <Stars radius={120} depth={60} count={4200} factor={3.2} saturation={0.15} fade speed={0.35} />
      <Stars radius={90} depth={35} count={900} factor={5.5} saturation={0.4} fade speed={0.12} />
    </>
  );
}

function AtmosphereGlow({
  radius,
  color,
  intensity,
  power = 2.8,
}: {
  radius: number;
  color: string;
  intensity: number;
  power?: number;
}) {
  const material = useMemo(() => new AtmosphereMaterial(), []);

  useEffect(() => {
    material.uniforms.glowColor.value.set(color);
    material.uniforms.intensity.value = intensity;
    material.uniforms.power.value = power;
  }, [material, color, intensity, power]);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh scale={radius}>
      <sphereGeometry args={[1, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function EarthGlobe() {
  const groupRef = useRef<THREE.Group>(null!);
  const earthTextures = useMemo(() => createEarthTextures(), []);

  useEffect(() => () => disposeEarthTextures(earthTextures), [earthTextures]);

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshStandardMaterial
          map={earthTextures.colorMap}
          bumpMap={earthTextures.bumpMap}
          bumpScale={0.045}
          roughness={0.82}
          metalness={0.1}
          emissive="#0a1628"
          emissiveIntensity={0.06}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 0.999, 64, 64]} />
        <meshPhysicalMaterial
          color="#1a2840"
          transparent
          opacity={0.2}
          roughness={0.3}
          metalness={0.05}
          clearcoat={0.45}
          clearcoatRoughness={0.2}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 1.002, 48, 48]} />
        <meshBasicMaterial color="#6b7a8f" wireframe transparent opacity={0.16} />
      </mesh>

      <AtmosphereGlow radius={GLOBE_RADIUS * 1.018} color="#4da3d9" intensity={0.5} power={2.6} />
      <AtmosphereGlow radius={GLOBE_RADIUS * 1.045} color="#7c6cf0" intensity={0.22} power={3.4} />
    </group>
  );
}

function HubMarker({ hub, active }: { hub: ShippingHub; active: boolean }) {
  const style = HUB_TIER_STYLES[hub.tier];
  const pos = latLonToVec3(hub.lat, hub.lon, GLOBE_RADIUS);
  const normal = new THREE.Vector3(...pos).normalize();
  const surface = pos.map((v, i) => v + normal.toArray()[i] * 0.02) as [number, number, number];

  const quat = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    return new THREE.Quaternion().setFromUnitVectors(up, normal);
  }, [normal.x, normal.y, normal.z]);

  const ringRef = useRef<THREE.Mesh>(null!);
  const headRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current && active) {
      const s = 1 + Math.sin(t * 2.4) * 0.14;
      ringRef.current.scale.set(s, s, 1);
    }
    if (headRef.current && hub.tier === "vault") {
      headRef.current.position.y = style.pillarHeight + style.headRadius + Math.sin(t * 2.8) * 0.02;
    }
  });

  const labelText = hub.tier === "vault" ? style.label : hub.name.replace(" Hub", "");
  const isVault = hub.tier === "vault";

  return (
    <group position={surface} quaternion={quat}>
      {/* Base disc on surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[style.pillarRadius * 2.2, 24]} />
        <meshBasicMaterial color={style.color} transparent opacity={0.55} />
      </mesh>

      {/* Pulsing ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[style.pillarRadius * 1.8, style.pillarRadius * 2.8, 32]} />
        <meshBasicMaterial
          color={style.glow}
          transparent
          opacity={active ? 0.55 : 0.28}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Pillar */}
      <mesh position={[0, style.pillarHeight / 2, 0]}>
        <cylinderGeometry args={[style.pillarRadius, style.pillarRadius * 1.15, style.pillarHeight, 12]} />
        <meshStandardMaterial
          color={style.color}
          emissive={style.color}
          emissiveIntensity={active ? 0.9 : 0.45}
          roughness={0.4}
          metalness={0.25}
          toneMapped={false}
        />
      </mesh>

      {/* Beacon head */}
      <mesh
        ref={headRef}
        position={[0, style.pillarHeight + style.headRadius, 0]}
      >
        <sphereGeometry args={[style.headRadius, 16, 16]} />
        <meshStandardMaterial
          color={isVault ? style.accent : style.color}
          emissive={isVault ? style.accent : style.glow}
          emissiveIntensity={active ? (isVault ? 1.5 : 1.0) : isVault ? 0.8 : 0.5}
          roughness={0.3}
          metalness={0.15}
          toneMapped={false}
        />
      </mesh>

      {isVault && (
        <mesh position={[0, style.pillarHeight + style.headRadius * 2.2, 0]}>
          <ringGeometry args={[style.headRadius * 1.1, style.headRadius * 1.6, 32]} />
          <meshBasicMaterial color={style.glow} transparent opacity={0.45} side={THREE.DoubleSide} />
        </mesh>
      )}

      <pointLight
        color={isVault ? style.accent : style.glow}
        intensity={isVault ? 0.45 : 0.2}
        distance={isVault ? 1.4 : 0.8}
        decay={2}
      />

      <Html
        position={[0, style.pillarHeight + style.headRadius * 2.8, 0]}
        center
        distanceFactor={6}
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        {isVault ? (
          <div className="text-center">
            <div className="text-[9px] font-bold tracking-wide text-amber-200 bg-black/75 border border-amber-500/40 px-2 py-0.5 rounded whitespace-nowrap">
              {style.label}
            </div>
            <div className="text-[7px] text-purple-300/80 mt-0.5">Austin · Origin</div>
          </div>
        ) : (
          <div
            className={`text-[9px] font-semibold whitespace-nowrap px-1.5 py-0.5 rounded ${
              hub.tier === "major"
                ? "text-blue-200 bg-blue-950/80 border border-blue-500/30"
                : "text-teal-200 bg-teal-950/80 border border-teal-500/30"
            }`}
          >
            {labelText}
          </div>
        )}
      </Html>
    </group>
  );
}

function ConnectionBurst({ position, trigger }: { position: [number, number, number]; trigger: number }) {
  const ringRef = useRef<THREE.Mesh>(null!);
  const flashRef = useRef<THREE.Mesh>(null!);
  const age = useRef(0);

  useEffect(() => {
    age.current = 0;
  }, [trigger]);

  useFrame((_, delta) => {
    if (!ringRef.current || !flashRef.current) return;
    age.current += delta;
    const t = age.current;
    if (t > 1.2) {
      ringRef.current.visible = false;
      flashRef.current.visible = false;
      return;
    }
    ringRef.current.visible = true;
    flashRef.current.visible = t < 0.25;
    const ease = 1 - Math.pow(1 - Math.min(t / 0.9, 1), 2);
    ringRef.current.scale.setScalar(0.4 + ease * 2.8);
    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.max(0, 0.85 * (1 - t / 1.1));
    if (flashRef.current.material) {
      (flashRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 - t * 3.5);
    }
  });

  return (
    <group position={position}>
      <mesh ref={flashRef} visible={false}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      <mesh ref={ringRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.08, 0.14, 32]} />
        <meshBasicMaterial color="#e9d5ff" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function RouteArrowHead({
  position,
  tangent,
  color,
  scale = 1,
}: {
  position: [number, number, number];
  tangent: THREE.Vector3;
  color: string;
  scale?: number;
}) {
  const quat = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const dir = tangent.clone().normalize();
    return new THREE.Quaternion().setFromUnitVectors(up, dir);
  }, [tangent.x, tangent.y, tangent.z]);

  return (
    <mesh position={position} quaternion={quat} scale={scale}>
      <coneGeometry args={[0.045, 0.12, 8]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function ShippingArc({
  points,
  originColor,
  destColor,
  active,
  highlighted = false,
  dimmed = false,
  drawIn = false,
}: {
  points: [number, number, number][];
  originColor: string;
  destColor: string;
  active: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
  drawIn?: boolean;
}) {
  const packetRef = useRef<THREE.Group>(null!);
  const dashRef = useRef<any>(null!);
  const glowRef = useRef<any>(null!);
  const [drawProgress, setDrawProgress] = useState(drawIn ? 0 : 1);
  const packetT = useRef(0);

  const vertexColors = useMemo(
    () => buildGradientColors(points.length, originColor, destColor),
    [points.length, originColor, destColor]
  );

  const visiblePoints = useMemo(
    () => sliceArcByProgress(points, drawProgress),
    [points, drawProgress]
  );
  const visibleColors = useMemo(
    () => vertexColors.slice(0, visiblePoints.length),
    [vertexColors, visiblePoints.length]
  );

  const endTangent = useMemo(() => arcTangentAt(points, 0.98), [points]);
  const arrowPos = points[points.length - 1];

  useFrame((state, delta) => {
    if (drawIn && drawProgress < 1) {
      setDrawProgress((prev) => Math.min(1, prev + delta * 1.35));
    }

    if (!active || visiblePoints.length < 2) {
      if (packetRef.current) packetRef.current.visible = false;
      return;
    }

    const speed = highlighted ? 1.1 : 0.75;
    packetT.current = (packetT.current + delta * speed * 0.22) % 1;
    const travelT = drawProgress < 1 ? drawProgress * 0.98 : packetT.current;
    const pos = positionAlongArc(visiblePoints, travelT);
    if (packetRef.current) {
      packetRef.current.position.copy(pos);
      packetRef.current.visible = true;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.15;
      packetRef.current.scale.setScalar((highlighted ? 1.35 : 1) * pulse);
    }

    const dashMat = dashRef.current?.material;
    if (dashMat) {
      dashMat.dashOffset = -state.clock.elapsedTime * (highlighted ? 3.2 : 2.2);
      dashMat.opacity = dimmed ? 0.2 : highlighted ? 0.95 : 0.7;
    }
    const glowMat = glowRef.current?.material;
    if (glowMat) {
      glowMat.opacity = dimmed ? 0.08 : 0.22 + Math.sin(state.clock.elapsedTime * 3) * 0.06;
    }
  });

  const baseWidth = highlighted ? 3.8 : 2.4;
  const glowWidth = highlighted ? 7 : 4.5;
  const opacity = dimmed ? 0.28 : highlighted ? 0.95 : 0.82;

  if (visiblePoints.length < 2) return null;

  return (
    <group>
      <Line
        ref={glowRef}
        points={visiblePoints}
        color={destColor}
        lineWidth={glowWidth}
        transparent
        opacity={dimmed ? 0.08 : 0.2}
      />
      <Line
        points={visiblePoints}
        vertexColors={visibleColors}
        lineWidth={baseWidth}
        transparent
        opacity={opacity}
      />
      <Line
        ref={dashRef}
        points={visiblePoints}
        color="#ffffff"
        lineWidth={highlighted ? 1.6 : 1.1}
        transparent
        opacity={dimmed ? 0.15 : 0.55}
        dashed
        dashSize={highlighted ? 0.14 : 0.1}
        gapSize={highlighted ? 0.08 : 0.06}
      />
      <group ref={packetRef} visible={false}>
        <mesh>
          <sphereGeometry args={[highlighted ? 0.055 : 0.042, 12, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh scale={2.2}>
          <sphereGeometry args={[highlighted ? 0.055 : 0.042, 8, 8]} />
          <meshBasicMaterial color={destColor} transparent opacity={0.35} />
        </mesh>
      </group>
      {drawProgress > 0.85 && (
        <RouteArrowHead
          position={arrowPos}
          tangent={endTangent}
          color={destColor}
          scale={highlighted ? 1.4 : 1}
        />
      )}
    </group>
  );
}

function BuyerMarker({
  buyer,
  hubPos,
  hubTier,
  visible,
  animating,
  dimmed,
}: {
  buyer: LiveBuyer;
  hubPos: [number, number, number];
  hubTier: ShippingHub["tier"];
  visible: boolean;
  animating: boolean;
  dimmed: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const pop = useRef(0);
  const connectFlash = useRef(0);
  const wasVisible = useRef(false);

  const pos = latLonToVec3(buyer.lat, buyer.lon, GLOBE_RADIUS);
  const normal = new THREE.Vector3(...pos).normalize();
  const offset = normal.clone().multiplyScalar(0.05);
  const display = pos.map((v, i) => v + [offset.x, offset.y, offset.z][i]) as [number, number, number];

  useEffect(() => {
    if (visible && !wasVisible.current) {
      connectFlash.current += 1;
    }
    wasVisible.current = visible;
  }, [visible]);

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

  const arcPoints = useMemo(
    () => buildGeodesicArc(display, hubPos, 52, 0.42),
    [display, hubPos]
  );
  const destColor = hubColor(hubTier);

  return (
    <>
      {visible && animating && (
        <>
          <ConnectionBurst position={display} trigger={connectFlash.current} />
          <ShippingArc
            points={arcPoints}
            originColor={BUYER_ORIGIN_COLOR}
            destColor={destColor}
            active={visible}
            dimmed={dimmed}
            drawIn
          />
        </>
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

function AmbientInboundRoutes({
  vaultPos,
  active,
}: {
  vaultPos: [number, number, number];
  active: boolean;
}) {
  return (
    <>
      {AMBIENT_INBOUND_ROUTES.map((route) => {
        const arcPoints = buildGeodesicArcLatLon(
          route.lat,
          route.lon,
          30.27,
          -97.74,
          GLOBE_RADIUS,
          0.07,
          0.42,
          48
        );
        return (
          <ShippingArc
            key={route.id}
            points={arcPoints}
            originColor="#34d399"
            destColor={VAULT_HUB_COLOR}
            active={active}
            dimmed
          />
        );
      })}
    </>
  );
}

function OptimizedSellerRoute({
  routeIndex,
  vaultPos,
  animating,
}: {
  routeIndex: number;
  vaultPos: [number, number, number];
  animating: boolean;
}) {
  const origin = ROUTE_ORIGIN_COORDS[routeIndex];
  if (!origin) return null;

  const originPos = useMemo(() => {
    const p = latLonToVec3(origin.lat, origin.lon, GLOBE_RADIUS);
    const n = new THREE.Vector3(...p).normalize().multiplyScalar(0.07);
    return [p[0] + n.x, p[1] + n.y, p[2] + n.z] as [number, number, number];
  }, [origin.lat, origin.lon]);

  const arcPoints = useMemo(
    () => buildGeodesicArcLatLon(origin.lat, origin.lon, 30.27, -97.74, GLOBE_RADIUS, 0.08, 0.55, 56),
    [origin.lat, origin.lon]
  );

  const pulseRef = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (pulseRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.18;
      pulseRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      <ShippingArc
        points={arcPoints}
        originColor={OPTIMIZED_ROUTE_COLOR}
        destColor={VAULT_HUB_COLOR}
        active={animating}
        highlighted
      />
      <group position={originPos}>
        <mesh ref={pulseRef}>
          <octahedronGeometry args={[0.14, 0]} />
          <meshBasicMaterial color={OPTIMIZED_ROUTE_COLOR} />
        </mesh>
        <mesh scale={2.2}>
          <ringGeometry args={[0.12, 0.2, 32]} />
          <meshBasicMaterial color={OPTIMIZED_ROUTE_COLOR} transparent opacity={0.45} side={THREE.DoubleSide} />
        </mesh>
        <Html position={[0, 0.22, 0]} style={{ pointerEvents: "none" }}>
          <div className="text-[8px] font-bold whitespace-nowrap px-2 py-0.5 rounded bg-emerald-950/90 border border-[#22ffaa]/50 text-[#22ffaa]">
            {origin.label}
          </div>
        </Html>
      </group>
      <mesh position={vaultPos}>
        <ringGeometry args={[0.18, 0.28, 32]} />
        <meshBasicMaterial color={OPTIMIZED_ROUTE_COLOR} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** US hub centroid — gentle camera focus while shipping animation runs. */
const US_FOCUS_POINT = (() => {
  const usHubs = SHIPPING_HUBS.filter((h) => h.tier !== "regional");
  const sum = new THREE.Vector3();
  usHubs.forEach((h) => {
    const p = latLonToVec3(h.lat, h.lon, 1);
    sum.add(new THREE.Vector3(...p));
  });
  return sum.divideScalar(usHubs.length).multiplyScalar(0.42);
})();

const IDLE_RESUME_MS = 2200;

function GlobeCameraControls({
  animating,
  mode,
  focusPoint,
  controlsEnabled = true,
}: {
  animating: boolean;
  mode: ShippingGlobeMode;
  focusPoint: THREE.Vector3 | null;
  controlsEnabled?: boolean;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null!);
  const [autoRotate, setAutoRotate] = useState(true);
  const resumeTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleStart = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    setAutoRotate(false);
  };

  const handleEnd = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setAutoRotate(true), IDLE_RESUME_MS);
  };

  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const interacting = !autoRotate;
    const home = new THREE.Vector3(0, 0, 0);

    const focus =
      mode === "home"
        ? controlsEnabled
          ? focusPoint
          : null
        : animating
          ? US_FOCUS_POINT
          : null;

    if (focus && !interacting) {
      controls.target.lerp(focus, delta * (mode === "home" ? 0.65 : 0.45));
      controls.autoRotateSpeed = THREE.MathUtils.lerp(controls.autoRotateSpeed, mode === "home" ? 0.35 : 0.58, delta * 1.2);
    } else if (!interacting) {
      controls.target.lerp(home, delta * 0.55);
      controls.autoRotateSpeed = THREE.MathUtils.lerp(
        controls.autoRotateSpeed,
        mode === "home" ? 0.28 : 0.42,
        delta * 1.2
      );
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={controlsEnabled}
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      minDistance={4.4}
      maxDistance={11.5}
      minPolarAngle={0.32}
      maxPolarAngle={Math.PI / 2 - 0.14}
      autoRotate={autoRotate}
      autoRotateSpeed={0.42}
      onStart={handleStart}
      onEnd={handleEnd}
    />
  );
}

function LiveGlobeScene({
  animating,
  optimizedIndex,
  mode,
  buyers,
  sceneActive,
}: {
  animating: boolean;
  optimizedIndex: number | null;
  mode: ShippingGlobeMode;
  buyers: LiveBuyer[];
  sceneActive: boolean;
}) {
  const [visibleBuyers, setVisibleBuyers] = useState<Set<string>>(new Set());
  const isHome = mode === "home";
  const showMotion = animating && sceneActive;

  useEffect(() => {
    if (!showMotion) {
      if (isHome) {
        setVisibleBuyers(new Set(buyers.slice(0, 6).map((b) => b.id)));
      } else {
        setVisibleBuyers(new Set());
      }
      return;
    }
    if (isHome) {
      setVisibleBuyers(new Set(buyers.map((b) => b.id)));
      return;
    }
    const timers = buyers.map((b) =>
      setTimeout(() => {
        setVisibleBuyers((prev) => new Set(prev).add(b.id));
      }, b.delayMs)
    );
    return () => timers.forEach(clearTimeout);
  }, [showMotion, isHome, buyers]);

  useEffect(() => {
    if (showMotion || isHome) return;
    setVisibleBuyers(new Set(buyers.slice(0, 4).map((b) => b.id)));
  }, [showMotion, isHome, buyers]);

  const hubById = useMemo(() => {
    const map: Record<string, ShippingHub> = {};
    SHIPPING_HUBS.forEach((h) => {
      map[h.id] = h;
    });
    return map;
  }, []);

  const hubPositions = useMemo(() => {
    const map: Record<string, [number, number, number]> = {};
    SHIPPING_HUBS.forEach((h) => {
      const p = latLonToVec3(h.lat, h.lon, GLOBE_RADIUS);
      const n = new THREE.Vector3(...p).normalize().multiplyScalar(0.06);
      map[h.id] = [p[0] + n.x, p[1] + n.y, p[2] + n.z];
    });
    return map;
  }, []);

  const vaultPos = hubPositions.vault;
  const dimBuyerArcs = optimizedIndex !== null;

  return (
    <>
      {!isHome && <color attach="background" args={["#020308"]} />}
      {isHome ? (
        <fog attach="fog" args={["#09090b", 14, 32]} />
      ) : (
        <fog attach="fog" args={["#060a14", 10, 28]} />
      )}

      <SpaceBackdrop lite={isHome} />

      <directionalLight position={[14, 5, 8]} intensity={2.1} color="#fff1dc" />
      <directionalLight position={[-6, -2, -10]} intensity={0.12} color="#3b4f7a" />
      <hemisphereLight args={["#1e3a5f", "#08060c", 0.28]} />
      <ambientLight intensity={0.08} color="#1a1f35" />
      <pointLight position={[6, 8, 4]} intensity={0.25} color="#a78bfa" distance={18} decay={2} />

      <EarthGlobe />

      {isHome && vaultPos && <AmbientInboundRoutes vaultPos={vaultPos} active={showMotion} />}

      {optimizedIndex !== null && vaultPos && (
        <OptimizedSellerRoute
          routeIndex={optimizedIndex}
          vaultPos={vaultPos}
          animating={showMotion}
        />
      )}

      {SHIPPING_HUBS.map((hub) => (
        <HubMarker key={hub.id} hub={hub} active={showMotion || hub.tier === "vault"} />
      ))}

      {buyers.map((buyer) => {
        const hub = hubById[buyer.hubId] ?? hubById.vault;
        return (
          <BuyerMarker
            key={buyer.id}
            buyer={buyer}
            hubPos={hubPositions[buyer.hubId] ?? hubPositions.vault}
            hubTier={hub.tier}
            visible={visibleBuyers.has(buyer.id)}
            animating={showMotion || isHome}
            dimmed={dimBuyerArcs && !isHome}
          />
        );
      })}
    </>
  );
}

const HUB_DOT_CLASS: Record<ShippingHub["tier"], string> = {
  vault: "sell-globe-hub-dot--vault",
  major: "sell-globe-hub-dot--major",
  regional: "sell-globe-hub-dot--regional",
};

function ShippingGlobeOverlay({
  animating,
  shipAddress,
  optimizedIndex,
  routeLabel,
}: {
  animating: boolean;
  shipAddress: string;
  optimizedIndex: number | null;
  routeLabel: string | null | undefined;
}) {
  const packagesInTransit = animating ? LIVE_BUYERS.length : 0;

  return (
    <div className="sell-globe-overlay">
      {/* Top row: status · ship-from · legend */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="sell-globe-panel sell-globe-status">
            {animating ? (
              <>
                <span className="sell-live-dot sell-live-dot--globe mb-2">
                  <span className="sell-live-pulse" />
                  Tracking live
                </span>
                <div className="sell-globe-status-title">In transit</div>
                <div className="sell-globe-status-count">
                  {packagesInTransit} package{packagesInTransit === 1 ? "" : "s"} in transit
                </div>
              </>
            ) : (
              <>
                <div className="sell-globe-status-title">Shipment mesh</div>
                <div className="sell-globe-status-idle">
                  {LIVE_BUYERS.slice(0, 4).length} buyers on network · idle
                </div>
              </>
            )}
          </div>

          {shipAddress.trim() ? (
            <div className="sell-globe-panel sell-globe-ship-from">
              <span className="sell-globe-ship-from-label">Ship from</span>
              <span className="sell-globe-ship-from-value">{shipAddress.trim()}</span>
            </div>
          ) : null}
        </div>

        <div className="sell-globe-panel sell-globe-legend shrink-0">
          <div className="sell-globe-legend-title">Map legend</div>
          <ul className="sell-globe-legend-list">
            <li className="sell-globe-legend-item">
              <span className="sell-globe-swatch sell-globe-swatch--vault" aria-hidden />
              Vault hub
            </li>
            <li className="sell-globe-legend-item">
              <span className="sell-globe-swatch sell-globe-swatch--major" aria-hidden />
              Major hub
            </li>
            <li className="sell-globe-legend-item">
              <span className="sell-globe-swatch sell-globe-swatch--regional" aria-hidden />
              Regional hub
            </li>
            <li className="sell-globe-legend-item">
              <span className="sell-globe-swatch sell-globe-swatch--buyer" aria-hidden />
              Buyer
            </li>
            <li className="sell-globe-legend-item">
              <span className="sell-globe-swatch sell-globe-swatch--beam" aria-hidden />
              Active shipment beam
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom: hub strip + controls hint */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2">
        {optimizedIndex !== null && routeLabel ? (
          <div className="sell-globe-panel sell-globe-route-badge mx-auto">
            <div className="sell-globe-route-badge-title">AI route optimized</div>
            <div className="sell-globe-route-badge-sub">
              {routeLabel} → NFTBAY Vault
            </div>
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <div className="sell-globe-panel sell-globe-hubs flex-1 min-w-0">
            <div className="sell-globe-hubs-inner">
              {SHIPPING_HUBS.map((hub) => (
                <span key={hub.id} className="sell-globe-hub-chip">
                  <span
                    className={`sell-globe-hub-dot ${HUB_DOT_CLASS[hub.tier]}`}
                    aria-hidden
                  />
                  {hub.name}
                </span>
              ))}
            </div>
          </div>
          <span className="sell-globe-hint shrink-0">Drag to rotate · Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}

function ShippingGlobeCanvas({
  animating,
  optimizedIndex,
  mode,
  buyers,
  sceneActive,
  focusPoint,
  height,
  controlsEnabled,
}: {
  animating: boolean;
  optimizedIndex: number | null;
  mode: ShippingGlobeMode;
  buyers: LiveBuyer[];
  sceneActive: boolean;
  focusPoint: THREE.Vector3 | null;
  height: number;
  controlsEnabled: boolean;
}) {
  if (!sceneActive) return null;

  const isHome = mode === "home";
  const pointerEvents = isHome && !controlsEnabled ? "none" : "auto";

  return (
    <Canvas
      camera={{ position: [0, 1.2, 6.8], fov: mode === "home" ? 40 : 42 }}
      gl={{
        alpha: isHome,
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: mode === "home" ? 1.22 : 1.15,
      }}
      dpr={mode === "home" ? [1, 1.25] : [1, 1.5]}
      style={{
        height,
        pointerEvents,
        touchAction: isHome && !controlsEnabled ? "pan-y" : "none",
      }}
    >
      <GlobeCameraControls
        animating={animating}
        mode={mode}
        focusPoint={focusPoint}
        controlsEnabled={controlsEnabled}
      />
      <LiveGlobeScene
        animating={animating}
        optimizedIndex={optimizedIndex}
        mode={mode}
        buyers={buyers}
        sceneActive={sceneActive}
      />
    </Canvas>
  );
}

export default function ShippingGlobe({
  mode = "sell",
  animating = false,
  optimizedIndex = null,
  shipAddress = "",
  height = 460,
  className = "",
  active = true,
  reducedMotion = false,
}: ShippingGlobeProps) {
  const [mounted, setMounted] = useState(false);
  const isHome = mode === "home";
  const buyers = useMemo(() => (isHome ? mergeLiveBuyersWithFeed() : LIVE_BUYERS), [isHome]);
  const activityFeed = useMemo(() => buildGlobeActivityFeed(), []);
  const [activityIdx, setActivityIdx] = useState(0);
  const [interactive, setInteractive] = useState(false);
  const effectiveAnimating = isHome ? !reducedMotion && active : animating;
  const controlsEnabled = !isHome || interactive;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!active) setInteractive(false);
  }, [active]);

  useEffect(() => {
    if (!isHome || reducedMotion) return;
    const t = setInterval(() => setActivityIdx((i) => (i + 1) % activityFeed.length), 2800);
    return () => clearInterval(t);
  }, [isHome, reducedMotion, activityFeed.length]);

  const focusPoint = useMemo(() => {
    if (!isHome || reducedMotion) return null;
    const event = activityFeed[activityIdx];
    if (!event) return null;
    const p = latLonToVec3(event.lat, event.lon, 1);
    return new THREE.Vector3(p[0], p[1], p[2]).multiplyScalar(0.38);
  }, [isHome, reducedMotion, activityFeed, activityIdx]);

  const routeLabel =
    optimizedIndex !== null ? ROUTE_ORIGIN_COORDS[optimizedIndex]?.label : null;

  const currentActivity: GlobeActivityEvent = activityFeed[activityIdx] ?? activityFeed[0];

  const shellClass = isHome
    ? `home-globe-canvas relative w-full overflow-hidden ${className}`
    : `relative w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#020308] ${className}`;

  if (!mounted) {
    return (
      <div
        className={shellClass}
        style={{ height }}
        role="img"
        aria-label="Loading live shipping globe"
      >
        <div className="absolute inset-0 flex items-center justify-center home-globe-loading">
          <div className="text-center">
            <div className="text-purple-300 text-xs tracking-[3px] mb-1">LIVE NETWORK</div>
            <div className="animate-pulse text-white/50 text-[10px]">Initializing global mesh…</div>
          </div>
        </div>
      </div>
    );
  }

  if (reducedMotion) {
    return (
      <div
        className={shellClass}
        style={{ height }}
        role="img"
        aria-label="NFTBAY live shipping network map"
      >
        <div className="absolute inset-0 home-globe-fallback flex flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-xs uppercase tracking-widest text-emerald-400/90">Live network</p>
          <p className="text-sm text-zinc-300 max-w-md">{formatActivityLine(currentActivity)}</p>
          <p className="text-[10px] text-zinc-600">
            {buyers.length} buyers active · gear shipping to Austin vault
          </p>
        </div>
        {isHome && <GlobeOverlayHome activity={currentActivity} />}
      </div>
    );
  }

  return (
    <div
      className={shellClass}
      style={{ height }}
      role="img"
      aria-label="NFTBAY live shipping network globe"
    >
      <div
        className={`absolute inset-0 ${isHome && !interactive ? "pointer-events-none" : ""}`}
        aria-hidden={isHome && !interactive}
      >
        <ShippingGlobeCanvas
          animating={effectiveAnimating}
          optimizedIndex={optimizedIndex}
          mode={mode}
          buyers={buyers}
          sceneActive={active}
          focusPoint={focusPoint}
          height={height}
          controlsEnabled={controlsEnabled}
        />
      </div>

      {isHome && !interactive && (
        <button
          type="button"
          className="home-globe-tap-gate"
          onClick={() => setInteractive(true)}
          aria-label="Click to explore the live shipping globe"
        >
          <span className="home-globe-tap-gate__pill">Click to explore</span>
        </button>
      )}

      {isHome ? (
        <GlobeOverlayHome activity={currentActivity} interactive={interactive} />
      ) : (
        <ShippingGlobeOverlay
          animating={effectiveAnimating}
          shipAddress={shipAddress}
          optimizedIndex={optimizedIndex}
          routeLabel={routeLabel}
        />
      )}
    </div>
  );
}

