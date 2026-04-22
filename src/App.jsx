import React, { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function Loader() {
  return (
    <Html center>
      <div
        style={{
          color: "white",
          background: "rgba(0,0,0,0.65)",
          padding: "12px 16px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        Cargando simulador 3D...
      </div>
    </Html>
  );
}

function Panel({ title, children }) {
  return (
    <div style={{ background: "rgba(7,11,18,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 16, boxShadow: "0 14px 40px rgba(0,0,0,0.25)" }}>
      <div style={{ color: "#d7e2f0", fontSize: 12, textTransform: "uppercase", letterSpacing: 1.6, marginBottom: 12, fontWeight: 700 }}>{title}</div>
      {children}
    </div>
  );
}

function ButtonTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        border: "1px solid rgba(255,255,255,0.08)",
        background: active ? "linear-gradient(135deg, rgba(25,118,210,0.35), rgba(0,188,212,0.22))" : "rgba(255,255,255,0.04)",
        color: active ? "#fff" : "#b5c3d6",
        borderRadius: 14,
        padding: "12px 14px",
        cursor: "pointer",
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, color: "#d2dceb", fontSize: 14, marginBottom: 10 }}>
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function SliderField({ label, value, onChange, min, max, step = 0.01, suffix = "" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#d2dceb", fontSize: 14, marginBottom: 8 }}>
        <span>{label}</span>
        <span>{value}{suffix}</span>
      </div>
      <input style={{ width: "100%" }} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 12 }}>
      <div style={{ color: "#8ea1b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</div>
      <div style={{ color: "white", fontSize: 18, fontWeight: 800, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function VesselTube({ points, color = "#b91c1c", radius = 0.05 }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), [points]);
  return (
    <mesh>
      <tubeGeometry args={[curve, 64, radius, 18, false]} />
      <meshPhysicalMaterial color={color} roughness={0.34} metalness={0.05} clearcoat={0.35} clearcoatRoughness={0.18} />
    </mesh>
  );
}

function BloodParticles({ phase = "sistole", visible = true }) {
  const ref = useRef();
  const count = 90;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = -0.15 + Math.random() * 0.3;
      arr[i * 3 + 1] = -0.7 + Math.random() * 0.8;
      arr[i * 3 + 2] = -0.08 + Math.random() * 0.16;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current || !visible) return;
    const pos = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += phase === "sistole" ? 0.012 : 0.0035;
      pos[i * 3 + 0] += Math.sin(state.clock.elapsedTime * 2 + i) * 0.0008;
      if (pos[i * 3 + 1] > 0.75) {
        pos[i * 3 + 1] = -0.72;
        pos[i * 3 + 0] = -0.12 + Math.random() * 0.24;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!visible) return null;
  return (
    <points ref={ref} position={[0, 0.1, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color={phase === "sistole" ? "#ff7a59" : "#60a5fa"} transparent opacity={0.9} />
    </points>
  );
}

function HeartModel({ cutaway, wireframe, showVessels, phase, intensity, autoRotate }) {
  const group = useRef();
  const shellMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#8b0f1a"),
        roughness: 0.42,
        metalness: 0.02,
        transmission: 0.0,
        clearcoat: 0.45,
        clearcoatRoughness: 0.18,
        sheen: 0.5,
        sheenColor: new THREE.Color("#ffb3b3"),
        wireframe,
      }),
    [wireframe]
  );
  const innerMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#4b0911"),
        roughness: 0.6,
        clearcoat: 0.2,
        wireframe,
      }),
    [wireframe]
  );

  useFrame((state) => {
    if (!group.current) return;
    if (autoRotate) group.current.rotation.y += 0.004;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * (phase === "sistole" ? 4.2 : 2.6)) * 0.025 * intensity;
    group.current.scale.set(pulse, pulse, pulse);
  });

  return (
    <group ref={group} position={[0, -0.15, 0]}>
      <Float speed={1.2} rotationIntensity={0.06} floatIntensity={0.1}>
        <mesh material={shellMat} castShadow receiveShadow>
          <sphereGeometry args={[0.82, 72, 72]} />
          <primitive object={new THREE.Matrix4().makeScale(0.82, 1.08, 0.9)} attach="matrix" />
        </mesh>

        <mesh position={[-0.42, 0.3, -0.16]} material={shellMat} castShadow receiveShadow>
          <sphereGeometry args={[0.34, 48, 48]} />
          <primitive object={new THREE.Matrix4().makeScale(1.1, 0.9, 1)} attach="matrix" />
        </mesh>

        <mesh position={[0.16, 0.54, 0]} rotation={[0.2, 0.05, -0.25]} material={shellMat} castShadow receiveShadow>
          <torusGeometry args={[0.42, 0.14, 32, 120, Math.PI * 1.32]} />
        </mesh>

        <mesh position={[0.05, 0.98, -0.02]} rotation={[0.08, 0.18, -0.1]} material={shellMat} castShadow receiveShadow>
          <cylinderGeometry args={[0.19, 0.24, 0.72, 42]} />
        </mesh>
        <mesh position={[-0.32, 0.98, -0.18]} rotation={[0.12, -0.2, 0.08]} material={new THREE.MeshPhysicalMaterial({ color: "#4d567e", roughness: 0.35, clearcoat: 0.22, wireframe })} castShadow receiveShadow>
          <cylinderGeometry args={[0.18, 0.22, 0.78, 38]} />
        </mesh>

        {showVessels && (
          <group>
            <VesselTube points={[[-0.12, -0.9, 0.62], [0.1, -0.55, 0.7], [0.24, -0.1, 0.6], [0.32, 0.18, 0.52]]} color="#7f1d1d" radius={0.03} />
            <VesselTube points={[[-0.02, -0.82, 0.54], [0.04, -0.45, 0.58], [0.12, -0.1, 0.56], [0.18, 0.12, 0.52]]} color="#ef4444" radius={0.017} />
            <VesselTube points={[[-0.48, 0.0, 0.52], [-0.35, 0.14, 0.58], [-0.18, 0.28, 0.6], [-0.06, 0.32, 0.62]]} color="#7f1d1d" radius={0.025} />
          </group>
        )}

        {cutaway && (
          <group position={[0.18, -0.02, 0.02]}>
            <mesh material={innerMat} castShadow receiveShadow>
              <sphereGeometry args={[0.48, 56, 56]} />
              <primitive object={new THREE.Matrix4().makeScale(0.85, 1.18, 0.78)} attach="matrix" />
            </mesh>
            <mesh position={[-0.12, 0.24, 0.08]} material={new THREE.MeshPhysicalMaterial({ color: "#f3d7d0", roughness: 0.28, clearcoat: 0.18, wireframe })}>
              <sphereGeometry args={[0.16, 42, 42]} />
              <primitive object={new THREE.Matrix4().makeScale(1.05, 0.58, 0.42)} attach="matrix" />
            </mesh>
            <mesh position={[-0.06, 0.2, 0.08]} rotation={[0.3, 0, 0.22]} material={new THREE.MeshStandardMaterial({ color: "#fff7ef", wireframe })}>
              <coneGeometry args={[0.035, 0.18, 16]} />
            </mesh>
            <mesh position={[0.0, 0.2, 0.08]} rotation={[0.3, 0, 0]} material={new THREE.MeshStandardMaterial({ color: "#fff7ef", wireframe })}>
              <coneGeometry args={[0.035, 0.18, 16]} />
            </mesh>
            <mesh position={[0.06, 0.2, 0.08]} rotation={[0.3, 0, -0.22]} material={new THREE.MeshStandardMaterial({ color: "#fff7ef", wireframe })}>
              <coneGeometry args={[0.035, 0.18, 16]} />
            </mesh>
            <BloodParticles phase={phase} visible={true} />
          </group>
        )}
      </Float>
    </group>
  );
}

function LiverModel({ wireframe, showVessels, autoRotate, intensity }) {
  const group = useRef();
  useFrame((state) => {
    if (!group.current) return;
    if (autoRotate) group.current.rotation.y += 0.004;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.8) * 0.008 * intensity;
    group.current.scale.set(pulse, pulse, pulse);
  });

  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#6d1a14"),
        roughness: 0.35,
        metalness: 0.02,
        clearcoat: 0.52,
        clearcoatRoughness: 0.18,
        sheen: 0.4,
        sheenColor: new THREE.Color("#ffb8a8"),
        wireframe,
      }),
    [wireframe]
  );

  return (
    <group ref={group} position={[0, -0.05, 0]}>
      <Float speed={1.1} rotationIntensity={0.05} floatIntensity={0.08}>
        <mesh material={mat} castShadow receiveShadow position={[0, 0, 0]}>
          <sphereGeometry args={[0.95, 72, 72]} />
          <primitive object={new THREE.Matrix4().makeScale(1.4, 0.72, 0.95)} attach="matrix" />
        </mesh>
        <mesh material={mat} castShadow receiveShadow position={[0.78, 0.02, 0.04]}>
          <sphereGeometry args={[0.52, 56, 56]} />
          <primitive object={new THREE.Matrix4().makeScale(0.95, 0.72, 0.88)} attach="matrix" />
        </mesh>
        <mesh position={[0.38, -0.48, 0.08]} material={new THREE.MeshPhysicalMaterial({ color: "#d0b07d", roughness: 0.58, clearcoat: 0.08, wireframe })}>
          <sphereGeometry args={[0.12, 26, 26]} />
          <primitive object={new THREE.Matrix4().makeScale(1, 0.85, 1)} attach="matrix" />
        </mesh>
        {showVessels && (
          <group>
            <VesselTube points={[[-0.82, 0.02, 0.52], [-0.45, 0.08, 0.5], [-0.02, 0.08, 0.48], [0.42, 0.02, 0.42]]} color="#7f1d1d" radius={0.028} />
            <VesselTube points={[[-0.7, -0.08, 0.58], [-0.26, -0.05, 0.53], [0.15, -0.08, 0.46], [0.52, -0.12, 0.36]]} color="#2563eb" radius={0.02} />
            <VesselTube points={[[-0.22, -0.02, 0.62], [-0.04, -0.04, 0.58], [0.12, -0.08, 0.5], [0.34, -0.14, 0.38]]} color="#ef4444" radius={0.012} />
          </group>
        )}
      </Float>
    </group>
  );
}

function AnatomyScene({ organ, cutaway, wireframe, showVessels, autoRotate, phase, intensity }) {
  return (
    <Canvas shadows camera={{ position: [0, 0.2, 4.2], fov: 40 }} style={{ width: "100%", height: "100%", borderRadius: 20 }}>
      <color attach="background" args={["#030712"]} />
      <fog attach="fog" args={["#030712", 4.5, 9]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 5, 3]} intensity={1.6} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <spotLight position={[-4, 3, 4]} intensity={1.1} angle={0.45} penumbra={0.8} color="#b3e5ff" />
      <pointLight position={[0, -1, 2]} intensity={0.45} color="#ff7a59" />
      <Suspense fallback={<Loader />}>
        <Environment preset="city" />
        {organ === "heart" ? (
          <HeartModel cutaway={cutaway} wireframe={wireframe} showVessels={showVessels} phase={phase} intensity={intensity} autoRotate={autoRotate} />
        ) : (
          <LiverModel wireframe={wireframe} showVessels={showVessels} autoRotate={autoRotate} intensity={intensity} />
        )}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]} receiveShadow>
          <circleGeometry args={[3.2, 60]} />
          <shadowMaterial opacity={0.28} />
        </mesh>
      </Suspense>
      <OrbitControls enablePan enableRotate enableZoom minDistance={2.2} maxDistance={8} />
    </Canvas>
  );
}

export default function App() {
  const [organ, setOrgan] = useState("heart");
  const [cutaway, setCutaway] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [showVessels, setShowVessels] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [phase, setPhase] = useState("sistole");
  const [intensity, setIntensity] = useState(1);
  const [opacityHint, setOpacityHint] = useState(82);

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at top, rgba(36,99,235,0.14), transparent 20%), linear-gradient(180deg, #020617 0%, #07111d 100%)", color: "white", fontFamily: "Inter, Arial, sans-serif", padding: 20 }}>
      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 20, marginBottom: 20 }}>
          <div style={{ background: "rgba(7,11,18,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: 22, boxShadow: "0 25px 70px rgba(0,0,0,0.35)" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <span style={{ background: "rgba(59,130,246,0.16)", color: "#cbe7ff", border: "1px solid rgba(59,130,246,0.18)", padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>Simulador médico 3D</span>
              <span style={{ background: "rgba(255,255,255,0.06)", color: "#d4deeb", border: "1px solid rgba(255,255,255,0.08)", padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>Interactivo y desplegable</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 44, lineHeight: 1.05, letterSpacing: -1.2 }}>Simulador anatómico 3D realista</h1>
            <p style={{ color: "#9eb0c6", fontSize: 16, lineHeight: 1.7, maxWidth: 800 }}>
              Esta versión elimina las dependencias que suelen causar error con aliases o modelos remotos. Ya incluye interacción real: rotación libre, zoom, capas, corte conceptual, vasos, malla geométrica y visual biomédica lista para GitHub y Vercel.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            <Metric label="Órgano activo" value={organ === "heart" ? "Corazón" : "Hígado"} />
            <Metric label="Motor" value="React Three Fiber" />
            <Metric label="Interacción" value="Rotar · zoom" />
            <Metric label="Estado" value="Deploy-ready" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Panel title="Órgano">
              <div style={{ display: "flex", gap: 8 }}>
                <ButtonTab active={organ === "heart"} onClick={() => setOrgan("heart")}>Corazón</ButtonTab>
                <ButtonTab active={organ === "liver"} onClick={() => setOrgan("liver")}>Hígado</ButtonTab>
              </div>
            </Panel>

            <Panel title="Vista e interacción">
              <Toggle checked={autoRotate} onChange={setAutoRotate} label="Autorrotación" />
              <Toggle checked={cutaway} onChange={setCutaway} label="Corte interno" />
              <Toggle checked={showVessels} onChange={setShowVessels} label="Mostrar vasos" />
              <Toggle checked={wireframe} onChange={setWireframe} label="Malla / wireframe" />
              <SliderField label="Intensidad animación" value={intensity} onChange={setIntensity} min={0.2} max={2} step={0.1} />
              <SliderField label="Transparencia guía" value={opacityHint} onChange={setOpacityHint} min={25} max={100} step={1} suffix="%" />
            </Panel>

            {organ === "heart" && (
              <Panel title="Fisiología cardíaca">
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <ButtonTab active={phase === "sistole"} onClick={() => setPhase("sistole")}>Sístole</ButtonTab>
                  <ButtonTab active={phase === "diastole"} onClick={() => setPhase("diastole")}>Diástole</ButtonTab>
                </div>
                <div style={{ color: "#9eb0c6", fontSize: 14, lineHeight: 1.6 }}>
                  {phase === "sistole"
                    ? "La válvula aórtica conceptual se representa en apertura y el flujo asciende con mayor velocidad."
                    : "En diástole el flujo disminuye y la dinámica del chorro se suaviza para representar el cierre funcional."}
                </div>
              </Panel>
            )}

            <Panel title="Métricas rápidas">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Metric label="Corte" value={cutaway ? "Activo" : "Oculto"} />
                <Metric label="Vasos" value={showVessels ? "Visibles" : "Ocultos"} />
                <Metric label="Malla" value={wireframe ? "Activa" : "Sólida"} />
                <Metric label="Mouse" value="Libre" />
              </div>
            </Panel>
          </div>

          <div style={{ display: "grid", gridTemplateRows: "1fr auto", gap: 16 }}>
            <div style={{ minHeight: 760, background: `linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.015)), rgba(6,10,18,${opacityHint / 100})`, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, overflow: "hidden", boxShadow: "0 25px 70px rgba(0,0,0,0.35)" }}>
              <AnatomyScene organ={organ} cutaway={cutaway} wireframe={wireframe} showVessels={showVessels} autoRotate={autoRotate} phase={phase} intensity={intensity} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <Metric label="Rotación" value="Arrastrar" />
              <Metric label="Zoom" value="Rueda" />
              <Metric label="Paneo" value="Click derecho" />
              <Metric label="Deploy" value="Vercel" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
