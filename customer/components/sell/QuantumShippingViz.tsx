import { useState, useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Html, Stars } from "@react-three/drei";

interface QuantumShippingVizProps {
  animating: boolean;
  optimizedIndex: number | null;
  shipAddress: string;
  onOptimize: (idx: number) => void;
}

function AnimatedWhitePath({
  points,
  color,
  active,
  thickness = 1,
}: {
  points: [number, number, number][];
  color: string;
  active: boolean;
  thickness?: number;
}) {
  const pulseRef = useRef<THREE.Group>(null!);
  const lineRef = useRef<any>(null!);

  useFrame((state) => {
    if (pulseRef.current) {
      if (!active) {
        pulseRef.current.visible = false;
      } else {
        pulseRef.current.visible = true;
        const t = (state.clock.elapsedTime * 1.8) % 1;
        const p0 = points[0];
        const p1 = points[1];
        const x = p0[0] + (p1[0] - p0[0]) * t;
        const y = p0[1] + (p1[1] - p0[1]) * t + Math.sin(t * 6) * 0.08;
        const z = p0[2] + (p1[2] - p0[2]) * t;
        pulseRef.current.position.set(x, y, z);
      }
    }
    if (lineRef.current && active) {
      const mat = lineRef.current.material;
      if (mat && typeof mat.dashOffset === "number") {
        mat.dashOffset = (state.clock.elapsedTime * 1.1) % 2.4;
      }
    }
  });

  return (
    <group>
      <Line
        ref={lineRef}
        points={points}
        color={color}
        lineWidth={thickness}
        dashed
        dashSize={0.42}
        dashScale={2.1}
      />
      <group ref={pulseRef}>
        <mesh>
          <sphereGeometry args={[0.07]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh scale={1.7}>
          <sphereGeometry args={[0.07]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
        </mesh>
      </group>
    </group>
  );
}

function Carrier3D({
  from,
  to,
  type,
  active,
  speed = 1.6,
  label,
  offset = 0,
  highlight = false,
}: {
  from: [number, number, number];
  to: [number, number, number];
  type: "plane" | "drone" | "truck";
  active: boolean;
  speed?: number;
  label: string;
  offset?: number;
  highlight?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const rotRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!groupRef.current) return;
    if (!active) {
      groupRef.current.position.set(from[0] * 0.7 + 0.4, from[1] + 0.3, from[2] * 0.7);
      return;
    }

    const phase = (state.clock.elapsedTime * speed + offset) % 1.05;
    const t = Math.min(phase, 0.995);

    const px = from[0] + (to[0] - from[0]) * t;
    const py = from[1] + (to[1] - from[1]) * t + (type === "truck" ? -0.6 : 0.15) + Math.sin(t * 11 + offset) * 0.06;
    const pz = from[2] + (to[2] - from[2]) * t;

    groupRef.current.position.set(px, py, pz);

    if (rotRef.current) {
      const dx = to[0] - from[0];
      const dz = to[2] - from[2];
      const yaw = Math.atan2(dx, dz);
      rotRef.current.rotation.y = yaw;
      if (type === "plane") rotRef.current.rotation.z = -0.12 + Math.sin(state.clock.elapsedTime * 3) * 0.03;
    }
  });

  const scale = type === "drone" ? 0.55 : type === "truck" ? 0.7 : 0.82;
  const matColor = highlight ? "#ffffff" : "#ccddff";

  return (
    <group ref={groupRef}>
      <group ref={rotRef}>
        {type === "plane" && (
          <group scale={scale}>
            <mesh>
              <boxGeometry args={[1.35, 0.11, 0.22]} />
              <meshBasicMaterial color={matColor} />
            </mesh>
            <mesh rotation={[0, 0, 0]}>
              <planeGeometry args={[1.05, 0.12]} />
              <meshBasicMaterial color={matColor} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[-0.55, 0.25, 0]}>
              <planeGeometry args={[0.28, 0.38]} />
              <meshBasicMaterial color={matColor} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0.68, 0, 0]}>
              <sphereGeometry args={[0.08]} />
              <meshBasicMaterial color="#aaffff" />
            </mesh>
          </group>
        )}

        {type === "drone" && (
          <group scale={scale * 0.9}>
            <mesh>
              <boxGeometry args={[0.32, 0.09, 0.32]} />
              <meshBasicMaterial color={matColor} />
            </mesh>
            {[
              [0.28, 0.28],
              [0.28, -0.28],
              [-0.28, 0.28],
              [-0.28, -0.28],
            ].map((off, k) => (
              <group key={k} position={[off[0], 0.05, off[1]]}>
                <mesh>
                  <cylinderGeometry args={[0.03, 0.03, 0.12, 4]} />
                  <meshBasicMaterial color="#999" />
                </mesh>
                <mesh position={[0, 0.1, 0]} rotation={[0, (k % 2) * 1.2, 0]}>
                  <planeGeometry args={[0.26, 0.05]} />
                  <meshBasicMaterial color="#fff" side={THREE.DoubleSide} />
                </mesh>
              </group>
            ))}
          </group>
        )}

        {type === "truck" && (
          <group scale={scale}>
            <mesh position={[-0.15, 0.12, 0]}>
              <boxGeometry args={[0.45, 0.32, 0.28]} />
              <meshBasicMaterial color="#ddd" />
            </mesh>
            <mesh position={[0.38, 0.08, 0]}>
              <boxGeometry args={[0.72, 0.24, 0.26]} />
              <meshBasicMaterial color={matColor} />
            </mesh>
            {[
              [-0.3, -0.18],
              [0.1, -0.18],
              [0.35, -0.18],
              [0.55, -0.18],
            ].map((w, k) => (
              <mesh key={k} position={[w[0], w[1], k % 2 === 0 ? -0.16 : 0.16]} rotation={[1.6, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.06, 8]} />
                <meshBasicMaterial color="#222" />
              </mesh>
            ))}
          </group>
        )}

        <Html position={[0, 0.95, 0]} style={{ pointerEvents: "none" }}>
          <div className={`text-[7px] font-mono uppercase tracking-[1px] ${highlight ? "text-white" : "text-white/60"}`}>
            {label}
          </div>
        </Html>
      </group>
    </group>
  );
}

function ShippingVizCanvas({
  animating,
  optimizedIndex,
  shipAddress,
}: {
  animating: boolean;
  optimizedIndex: number | null;
  shipAddress: string;
}) {
  const routes = useMemo(
    () => [
      { idx: 0, origin: "Austin, TX", from: [-1.5, 1.8, -0.5] as [number, number, number], carrier: "PLANE", name: "FEDEX QUANTUM", color: "#aaffff" },
      { idx: 1, origin: "Los Angeles, CA", from: [-6.5, 2.2, -3.5] as [number, number, number], carrier: "DRONE", name: "UPS PHOTON", color: "#ffddaa" },
      { idx: 2, origin: "New York, NY", from: [5.5, 1.5, -1.2] as [number, number, number], carrier: "PLANE", name: "DHL ENTANGLE", color: "#aaffaa" },
      { idx: 3, origin: "Chicago, IL", from: [-2.8, -0.8, 2.5] as [number, number, number], carrier: "TRUCK", name: "QUANTUM TRUCK", color: "#ffeecc" },
      { idx: 4, origin: "Seattle, WA", from: [-7.2, 3.5, 1.8] as [number, number, number], carrier: "DRONE", name: "PRIME DRONE", color: "#ccddff" },
      { idx: 5, origin: "Miami, FL", from: [4.2, -2.1, -2.8] as [number, number, number], carrier: "PLANE", name: "VAULTWING", color: "#ffccff" },
    ],
    []
  );

  const vaultPos: [number, number, number] = [1.8, 0.2, 0.1];

  const primaryIdx = useMemo(() => {
    const addr = (shipAddress || "").toLowerCase();
    if (addr.includes("austin")) return 0;
    if (addr.includes("los") || addr.includes("la ") || addr.includes("angeles")) return 1;
    if (addr.includes("new york") || addr.includes("nyc") || addr.includes("ny ")) return 2;
    if (addr.includes("chicago")) return 3;
    if (addr.includes("seattle")) return 4;
    if (addr.includes("miami") || addr.includes("fl ")) return 5;
    return 0;
  }, [shipAddress]);

  return (
    <Canvas
      camera={{ position: [0, 9, 13.5], fov: 48 }}
      style={{ background: "#000" }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={0.35} />
      <pointLight position={[-10, 14, -4]} intensity={0.8} color="#aaffff" />
      <pointLight position={[12, -6, 8]} intensity={0.6} color="#ffeecc" />

      <Stars radius={120} depth={22} count={48} factor={1.6} saturation={0} fade speed={0.6} />

      <group position={vaultPos}>
        <mesh>
          <sphereGeometry args={[0.55]} />
          <meshBasicMaterial color="#112211" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.72]} />
          <meshBasicMaterial color="#22ffaa" transparent opacity={0.12} wireframe />
        </mesh>
        <Html position={[0, 1.4, 0]} style={{ pointerEvents: "none" }}>
          <div className="text-[9px] text-center font-mono text-emerald-400 tracking-[1px] whitespace-nowrap">
            NFTBAY VAULT
            <br />
            AUSTIN, TX
          </div>
        </Html>
      </group>

      {routes.map((route, i) => {
        const isOpt = optimizedIndex === i;
        const isPrimary = primaryIdx === i;
        const from = route.from;
        const points: [number, number, number][] = [from, vaultPos];
        const lineColor = isOpt ? "#ffffff" : isPrimary ? "#aaffff" : "#777";

        return (
          <group key={i}>
            <mesh position={from}>
              <sphereGeometry args={[0.18]} />
              <meshBasicMaterial color={isOpt || isPrimary ? "#ffffff" : "#555"} />
            </mesh>

            <Html position={[from[0], from[1] + 0.85, from[2]]} style={{ pointerEvents: "none" }}>
              <div
                className={`text-[8px] font-mono tracking-tight whitespace-nowrap ${isOpt || isPrimary ? "text-white" : "text-white/50"}`}
              >
                {route.origin}
                {isPrimary && <span className="text-[#22ffaa] ml-1">• YOURS</span>}
              </div>
            </Html>

            <AnimatedWhitePath
              points={points}
              color={lineColor}
              active={animating || isOpt}
              thickness={isOpt ? 2.2 : isPrimary ? 1.8 : 1.1}
            />

            <Carrier3D
              from={from}
              to={vaultPos}
              type="plane"
              active={animating}
              speed={isOpt ? 2.8 : 1.65}
              label={route.name}
              offset={i * 0.19}
              highlight={isOpt || isPrimary}
            />
            <Carrier3D
              from={from}
              to={vaultPos}
              type={route.carrier === "DRONE" ? "drone" : "truck"}
              active={animating}
              speed={isOpt ? 3.1 : 1.3 + (i % 2) * 0.3}
              label={route.carrier}
              offset={0.41 + i * 0.11}
              highlight={isOpt}
            />
          </group>
        );
      })}

      <mesh position={[0, -3.2, 0]} rotation={[-Math.PI * 0.5, 0, 0]}>
        <planeGeometry args={[38, 26]} />
        <meshBasicMaterial color="#050505" transparent opacity={0.7} />
      </mesh>
    </Canvas>
  );
}

export default function QuantumShippingViz({ animating, optimizedIndex, shipAddress, onOptimize }: QuantumShippingVizProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-80 w-full ios-card flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#22ffaa] text-xs tracking-[3px] mb-1">QUANTUM 3D LOADING</div>
          <div className="animate-pulse text-white/60 text-[10px]">INITIALIZING PRIMITIVES • PATHS • CARRIERS</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-80 w-full ios-card overflow-hidden">
      <ShippingVizCanvas animating={animating} optimizedIndex={optimizedIndex} shipAddress={shipAddress} />
      <div className="absolute top-2 left-2 text-[9px] px-2.5 py-0.5 rounded bg-black/70 border border-white/20 text-white/70 tracking-[1.5px] pointer-events-none">
        QUANTUM 3D • PRIMITIVES • ANIM LINES
      </div>
      <div className="absolute top-2 right-2 text-[9px] px-2 py-0.5 bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-[8px] tracking-widest pointer-events-none">
        VAULT: AUSTIN TX
      </div>
    </div>
  );
}