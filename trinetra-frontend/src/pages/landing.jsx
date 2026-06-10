import { useState, useEffect, useRef, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Eye, Zap, Radar, Satellite, Lock, Target, Activity } from 'lucide-react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';
import WavingFlag from '../components/common/WavingFlag';

/* ══════════════════════════════════════════
   HERO 3D SCENE
══════════════════════════════════════════ */

// Starfield
function Stars() {
  const ref = useRef();
  const positions = useRef(() => {
    const arr = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000 * 3; i++) arr[i] = (Math.random() - 0.5) * 100;
    return arr;
  }).current();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.012;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#ffffff" transparent opacity={0.85} sizeAttenuation />
    </points>
  );
}

// Earth globe
function Earth() {
  const meshRef = useRef();
  const cloudsRef = useRef();
  const R = 2.6;

  const [earthMap, cloudsMap] = useLoader(TextureLoader, [
    '/earth.jpg',
    '/earth-clouds.png',
  ]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (meshRef.current)  meshRef.current.rotation.y  = t * 0.06;
    if (cloudsRef.current) cloudsRef.current.rotation.y = t * 0.065;
  });

  return (
    <group>
      {/* real earth */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[R, 64, 64]} />
        <meshStandardMaterial map={earthMap} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[R * 1.005, 64, 64]} />
        <meshStandardMaterial map={cloudsMap} transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* atmosphere glow */}
      <mesh>
        <sphereGeometry args={[R * 1.08, 32, 32]} />
        <meshStandardMaterial color="#2255ff" emissive="#0033cc" emissiveIntensity={0.25} transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>
      {/* outer halo */}
      <mesh>
        <sphereGeometry args={[R * 1.18, 32, 32]} />
        <meshStandardMaterial color="#1133aa" transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>

      <IndiaMarker R={R} />
    </group>
  );
}

function IndiaMarker({ R = 2.6 }) {
  const dot  = useRef();
  const ring1 = useRef(), ring2 = useRef(), ring3 = useRef();
  const lat = 20 * (Math.PI / 180);
  const lon = (78 + 180) * (Math.PI / 180);
  const r   = R + 0.06;
  const x   = -r * Math.cos(lat) * Math.cos(lon);
  const y   =  r * Math.sin(lat);
  const z   =  r * Math.cos(lat) * Math.sin(lon);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (dot.current)   dot.current.material.emissiveIntensity   = 1.2 + Math.sin(t * 4) * 0.6;
    if (ring1.current) { ring1.current.material.opacity = 0.7 + Math.sin(t * 3) * 0.3; ring1.current.scale.setScalar(1 + Math.sin(t * 3) * 0.2); }
    if (ring2.current) { ring2.current.material.opacity = 0.4 + Math.sin(t * 2 + 1) * 0.3; ring2.current.scale.setScalar(1 + Math.sin(t * 2 + 1) * 0.35); }
    if (ring3.current) { ring3.current.material.opacity = 0.2 + Math.sin(t * 1.5 + 2) * 0.2; ring3.current.scale.setScalar(1 + Math.sin(t * 1.5 + 2) * 0.5); }
  });

  return (
    <group position={[x, y, z]}>
      <mesh ref={dot}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={1.5} />
      </mesh>
      <mesh ref={ring1} rotation={[Math.PI/2, 0, 0]}>
        <ringGeometry args={[0.1, 0.14, 32]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI/2, 0, 0]}>
        <ringGeometry args={[0.18, 0.21, 32]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring3} rotation={[Math.PI/2, 0, 0]}>
        <ringGeometry args={[0.28, 0.30, 32]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color="#ff6600" intensity={4} distance={3} />
    </group>
  );
}

// Orbiting satellite
function OrbitingSatellite({ radius, speed, tilt, color = '#00ff88' }) {
  const groupRef = useRef();
  const satRef   = useRef();
  const trailRef = useRef();

  // build trail arc points
  const trailPts = useRef(() => {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const a = (i / 60) * Math.PI * 0.6;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return pts;
  }).current();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed;
    if (groupRef.current) { groupRef.current.rotation.y = t; groupRef.current.rotation.z = tilt; }
    if (satRef.current)   satRef.current.rotation.x += 0.04;
  });

  return (
    <group ref={groupRef}>
      {/* full orbit ring */}
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <ringGeometry args={[radius - 0.008, radius + 0.008, 128]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
      {/* glowing trail arc */}
      <line ref={trailRef}>
        <bufferGeometry setFromPoints={trailPts} />
        <lineBasicMaterial color={color} transparent opacity={0.55} />
      </line>
      {/* satellite body */}
      <group ref={satRef} position={[radius, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.14, 0.07, 0.07]} />
          <meshStandardMaterial color="#cccccc" metalness={0.95} roughness={0.1} emissive={color} emissiveIntensity={0.3} />
        </mesh>
        {/* solar panels */}
        <mesh position={[0.18, 0, 0]}>
          <boxGeometry args={[0.18, 0.002, 0.1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
        </mesh>
        <mesh position={[-0.18, 0, 0]}>
          <boxGeometry args={[0.18, 0.002, 0.1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
        </mesh>
        <pointLight color={color} intensity={2.5} distance={2.5} />
      </group>
    </group>
  );
}

// Radar sweep — equatorial plane around earth
function RadarSweep() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = clock.elapsedTime * 0.9;
  });
  return (
    <group ref={ref}>
      {/* layered sweep wedge */}
      {[0.18, 0.10, 0.05].map((op, i) => (
        <mesh key={i} rotation={[Math.PI/2, 0, 0]}>
          <ringGeometry args={[2.7, 5.5, 80, 1, 0, Math.PI * (0.35 - i * 0.08)]} />
          <meshBasicMaterial color="#00ff41" transparent opacity={op} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* leading edge line */}
      <line>
        <bufferGeometry setFromPoints={[new THREE.Vector3(2.7, 0, 0), new THREE.Vector3(5.5, 0, 0)]} />
        <lineBasicMaterial color="#00ff41" transparent opacity={0.7} />
      </line>
    </group>
  );
}

// Scan beam from satellite to earth surface
function ScanBeam({ radius, speed, tilt }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) { ref.current.rotation.y = clock.elapsedTime * speed; ref.current.rotation.z = tilt; }
  });
  const pts = [new THREE.Vector3(radius, 0, 0), new THREE.Vector3(0.5, 0, 0)];
  return (
    <group ref={ref}>
      <line>
        <bufferGeometry setFromPoints={pts} />
        <lineBasicMaterial color="#00ff88" transparent opacity={0.4} />
      </line>
      {/* cone beam */}
      <mesh position={[radius * 0.5, 0, 0]} rotation={[0, 0, Math.PI/2]}>
        <coneGeometry args={[0.25, radius * 0.5, 6, 1, true]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function HeroScene() {
  return (
    <Canvas
      camera={{ position: [2.5, 1.2, 9], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      {/* strong sun from top-left — physically correct units need high values */}
      <ambientLight intensity={2.5} />
      <directionalLight color="#ffffff" intensity={6} position={[-5, 4, 5]} />
      <directionalLight color="#4488ff" intensity={2} position={[5, -2, -3]} />

      <Suspense fallback={null}>
        <Stars />
        <Earth />
        <RadarSweep />
        <OrbitingSatellite radius={3.8} speed={0.38} tilt={0.35}  color="#00ff88" />
        <OrbitingSatellite radius={4.6} speed={0.24} tilt={-0.75} color="#00aaff" />
        <OrbitingSatellite radius={5.4} speed={0.16} tilt={1.15}  color="#ffaa00" />
        <ScanBeam radius={3.8} speed={0.38} tilt={0.35} />
        <ScanBeam radius={4.6} speed={0.24} tilt={-0.75} />
        <ScanBeam radius={5.4} speed={0.16} tilt={1.15} />
      </Suspense>
    </Canvas>
  );
}

/* ══════════════════════════════════════════
   SECTION 2 · RADAR RINGS 3D
══════════════════════════════════════════ */
/* ══════════════════════════════════════════
   SECTION 3 · WIREFRAME DRONE 3D
══════════════════════════════════════════ */
/* ══════════════════════════════════════════
   SECTION 4 · PARTICLE DATA STREAM
══════════════════════════════════════════ */
/* ══════════════════════════════════════════
   SECTION 5 · TERRAIN GRID
══════════════════════════════════════════ */
/* ══════════════════════════════════════════
   SECTION 6 · HUD RINGS
══════════════════════════════════════════ */
/* ══════════════════════════════════════════
   SECTION 7 · RISING BEAM CTA
══════════════════════════════════════════ */
function RisingBeam() {
  const beam1 = useRef(), beam2 = useRef(), beam3 = useRef();
  const starsRef = useRef();
  const ring1 = useRef(), ring2 = useRef(), ring3 = useRef();

  const starPos = useRef(() => {
    const arr = new Float32Array(1200 * 3);
    for (let i = 0; i < 1200; i++) {
      arr[i*3]   = (Math.random() - 0.5) * 40;
      arr[i*3+1] = (Math.random() - 0.5) * 25;
      arr[i*3+2] = (Math.random() - 0.5) * 15;
    }
    return arr;
  }).current();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (starsRef.current) starsRef.current.rotation.y = t * 0.006;
    const pulse = 0.05 + Math.sin(t * 1.8) * 0.03;
    if (beam1.current) { beam1.current.rotation.y = t * 0.25; beam1.current.material.opacity = pulse; }
    if (beam2.current) { beam2.current.rotation.y = -t * 0.18; beam2.current.material.opacity = pulse * 0.6; }
    if (beam3.current) { beam3.current.rotation.y = t * 0.4; beam3.current.material.opacity = pulse * 0.35; }
    if (ring1.current) { ring1.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.06); ring1.current.material.opacity = 0.35 + Math.sin(t * 1.2) * 0.15; }
    if (ring2.current) { ring2.current.scale.setScalar(1 + Math.sin(t * 0.9 + 1) * 0.08); ring2.current.material.opacity = 0.2 + Math.sin(t * 0.9) * 0.1; }
    if (ring3.current) ring3.current.rotation.z = t * 0.3;
  });

  return (
    <group>
      {/* starfield */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.055} color="#ffffff" transparent opacity={0.55} sizeAttenuation />
      </points>

      <mesh ref={beam1} position={[0, 3, 0]}>
        <coneGeometry args={[2.2, 14, 8, 1, true]} />
        <meshBasicMaterial color="#d4af37" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={beam2} position={[0, 4, 0]}>
        <coneGeometry args={[3.5, 16, 6, 1, true]} />
        <meshBasicMaterial color="#d4af37" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={beam3} position={[0, 2, 0]}>
        <coneGeometry args={[0.8, 10, 6, 1, true]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.14} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring1} rotation={[Math.PI/2, 0, 0]}>
        <ringGeometry args={[1.8, 1.86, 80]} />
        <meshBasicMaterial color="#d4af37" transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI/2, 0, 0]}>
        <ringGeometry args={[2.8, 2.84, 80]} />
        <meshBasicMaterial color="#d4af37" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring3} rotation={[Math.PI/2, 0, 0]}>
        <ringGeometry args={[3.8, 3.84, 80, 1, 0, Math.PI * 1.4]} />
        <meshBasicMaterial color="#ffcc44" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI/2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[2.5, 48]} />
        <meshBasicMaterial color="#d4af37" transparent opacity={0.12} />
      </mesh>

      <pointLight color="#d4af37" intensity={5} distance={12} />
      <pointLight color="#ffcc44" intensity={2} distance={6} position={[0, -1, 0]} />
    </group>
  );
}
function CtaScene() {
  return (
    <Canvas camera={{ position: [0, 1, 11], fov: 48 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
      <RisingBeam />
    </Canvas>
  );
}

function HudRings() {
  const r1 = useRef(), r2 = useRef(), r3 = useRef(), r4 = useRef(), r5 = useRef();
  const coreRef = useRef();
  const tickGroupRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (r1.current) r1.current.rotation.z = t * 0.45;
    if (r2.current) r2.current.rotation.z = -t * 0.28;
    if (r3.current) { r3.current.rotation.z = t * 0.18; r3.current.rotation.x = t * 0.12; }
    if (r4.current) { r4.current.rotation.y = t * 0.55; r4.current.rotation.z = t * 0.1; }
    if (r5.current) r5.current.rotation.x = -t * 0.35;
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.8;
      coreRef.current.rotation.x = t * 0.5;
    }
    if (tickGroupRef.current) tickGroupRef.current.rotation.z = t * 0.45;
  });

  return (
    <group>
      {/* outer dashed arc */}
      <mesh ref={r1}>
        <ringGeometry args={[4.2, 4.26, 3, 1, 0, Math.PI * 1.6]} />
        <meshBasicMaterial color="#00aaff" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={r2}>
        <ringGeometry args={[3.1, 3.14, 3, 1, 0, Math.PI * 1.3]} />
        <meshBasicMaterial color="#00ccff" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* tilted torus 1 */}
      <mesh ref={r3}>
        <torusGeometry args={[2.5, 0.014, 4, 100]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.25} />
      </mesh>
      <mesh ref={r4} rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[1.8, 0.018, 4, 80]} />
        <meshBasicMaterial color="#00aaff" transparent opacity={0.45} />
      </mesh>
      <mesh ref={r5} rotation={[Math.PI/3, 0, 0]}>
        <torusGeometry args={[1.2, 0.016, 4, 60]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.4} />
      </mesh>

      {/* rotating tick marks on outer ring */}
      <group ref={tickGroupRef}>
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a)*4.2, Math.sin(a)*4.2, 0]} rotation={[0, 0, a]}>
              <boxGeometry args={[0.03, i % 6 === 0 ? 0.25 : 0.12, 0.01]} />
              <meshBasicMaterial color="#00aaff" transparent opacity={i % 6 === 0 ? 0.7 : 0.35} />
            </mesh>
          );
        })}
      </group>

      {/* wireframe core icosahedron */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.45, 1]} />
        <meshBasicMaterial color="#00ccff" wireframe />
      </mesh>

      {/* center glow dot */}
      <mesh>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>

      <pointLight color="#0066ff" intensity={8} distance={14} />
      <pointLight color="#00ffff" intensity={4} distance={8} position={[2, 2, 2]} />
    </group>
  );
}
function HudScene() {
  return (
    <Canvas camera={{ position: [0, 0, 9], fov: 48 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent', width: '100%', height: '100%' }}>
      <HudRings />
    </Canvas>
  );
}

function TerrainGrid() {
  const meshRef = useRef();
  const cols = 48, rows = 48, spacing = 0.5;

  const { positions, indices } = useRef(() => {
    const positions = new Float32Array(cols * rows * 3);
    const indices = [];
    let idx = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      positions[idx++] = (c - cols/2) * spacing;
      positions[idx++] = 0;
      positions[idx++] = (r - rows/2) * spacing;
      // grid lines
      if (c < cols - 1) indices.push(r*cols+c, r*cols+c+1);
      if (r < rows - 1) indices.push(r*cols+c, (r+1)*cols+c);
    }
    return { positions, indices };
  }).current();

  const indexArr = useRef(new Uint32Array(indices)).current;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    const pos = meshRef.current.geometry.attributes.position.array;
    let i = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = (c - cols/2) * spacing, z = (r - rows/2) * spacing;
      pos[i+1] =
        Math.sin(x * 0.45 + t * 0.9) * 0.55 +
        Math.sin(z * 0.38 + t * 0.65) * 0.45 +
        Math.sin((x + z) * 0.25 + t * 0.5) * 0.3;
      i += 3;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <lineSegments ref={meshRef} rotation={[-0.52, 0, 0]} position={[0, -1.5, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="index" args={[indexArr, 1]} />
      </bufferGeometry>
      <lineBasicMaterial color="#ff6600" transparent opacity={0.5} />
    </lineSegments>
  );
}
function TerrainScene() {
  return (
    <Canvas camera={{ position: [0, 4, 10], fov: 58 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent', width: '100%', height: '100%' }}>
      <TerrainGrid />
      <pointLight color="#ff6600" intensity={6} distance={20} position={[0, 6, 0]} />
      <pointLight color="#ff2200" intensity={3} distance={12} position={[5, 2, 0]} />
    </Canvas>
  );
}

function DataParticles() {
  const ref = useRef();
  const linesRef = useRef();
  const count = 900;

  const { positions, speeds, cols } = useRef(() => {
    const positions = new Float32Array(count * 3);
    const speeds = [];
    const cols = 30;
    const spacing = 0.65;
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      positions[i*3]   = (col - cols/2) * spacing + (Math.random() - 0.5) * 0.2;
      positions[i*3+1] = (Math.random() - 0.5) * 22;
      positions[i*3+2] = (Math.random() - 0.5) * 6;
      speeds.push(0.012 + Math.random() * 0.025);
    }
    return { positions, speeds, cols };
  }).current();

  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i*3+1] -= speeds[i];
      if (pos[i*3+1] < -11) pos[i*3+1] = 11;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  // vertical column lines
  const linePoints = useRef(() => {
    const pts = [];
    for (let c = 0; c < 30; c++) {
      const x = (c - 15) * 0.65;
      pts.push([new THREE.Vector3(x, -11, 0), new THREE.Vector3(x, 11, 0)]);
    }
    return pts;
  }).current();

  return (
    <group>
      {/* falling column lines */}
      {linePoints.map((pts, i) => (
        <line key={i}>
          <bufferGeometry setFromPoints={pts} />
          <lineBasicMaterial color="#d4af37" transparent opacity={0.04} />
        </line>
      ))}
      {/* falling particles */}
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.07} color="#d4af37" transparent opacity={0.75} sizeAttenuation />
      </points>
    </group>
  );
}
function DataScene() {
  return (
    <Canvas camera={{ position: [0, 0, 14], fov: 55 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
      <DataParticles />
    </Canvas>
  );
}

function WireframeDrone() {
  const bodyRef = useRef();
  const rotors = [useRef(), useRef(), useRef(), useRef()];
  const beamRef = useRef();
  const ringRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (bodyRef.current) {
      bodyRef.current.rotation.y = t * 0.35;
      bodyRef.current.position.y = Math.sin(t * 0.7) * 0.4;
    }
    rotors.forEach((r, i) => { if (r.current) r.current.rotation.y = t * (i % 2 === 0 ? 10 : -10); });
    if (beamRef.current) beamRef.current.material.opacity = 0.04 + Math.sin(t * 2) * 0.03;
    if (ringRef.current) { ringRef.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.08); ringRef.current.material.opacity = 0.15 + Math.sin(t * 1.5) * 0.1; }
  });

  const armPos = [[1.4, 0, 1.4], [1.4, 0, -1.4], [-1.4, 0, 1.4], [-1.4, 0, -1.4]];

  return (
    <group ref={bodyRef}>
      {/* main body box */}
      <mesh>
        <boxGeometry args={[0.7, 0.18, 0.7]} />
        <meshBasicMaterial color="#00ff41" wireframe />
      </mesh>
      {/* center dome */}
      <mesh>
        <sphereGeometry args={[0.28, 10, 10]} />
        <meshBasicMaterial color="#00ff41" wireframe />
      </mesh>
      {/* camera lens */}
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 0.12, 8]} />
        <meshBasicMaterial color="#00ff41" transparent opacity={0.8} />
      </mesh>

      {/* arms + rotors */}
      {armPos.map(([x, , z], i) => (
        <group key={i}>
          {/* arm tube */}
          <mesh position={[x * 0.5, 0, z * 0.5]} rotation={[0, Math.atan2(x, z), 0]}>
            <cylinderGeometry args={[0.015, 0.015, Math.sqrt(x*x+z*z)*0.85, 4]} />
            <meshBasicMaterial color="#00ff41" transparent opacity={0.5} />
          </mesh>
          {/* rotor disc */}
          <mesh ref={rotors[i]} position={[x, 0.05, z]}>
            <torusGeometry args={[0.42, 0.016, 4, 40]} />
            <meshBasicMaterial color="#00ff41" transparent opacity={0.75} />
          </mesh>
          {/* rotor hub */}
          <mesh position={[x, 0.05, z]}>
            <cylinderGeometry args={[0.05, 0.05, 0.04, 6]} />
            <meshBasicMaterial color="#00ff41" transparent opacity={0.9} />
          </mesh>
          {/* landing leg */}
          <line>
            <bufferGeometry setFromPoints={[new THREE.Vector3(x*0.7, 0, z*0.7), new THREE.Vector3(x*0.7, -0.5, z*0.7)]} />
            <lineBasicMaterial color="#00ff41" transparent opacity={0.35} />
          </line>
        </group>
      ))}

      {/* scan cone downward */}
      <mesh ref={beamRef} position={[0, -0.3, 0]}>
        <coneGeometry args={[2.2, 4, 8, 1, true]} />
        <meshBasicMaterial color="#00ff41" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
      {/* scan ground ring */}
      <mesh ref={ringRef} position={[0, -2.3, 0]} rotation={[Math.PI/2, 0, 0]}>
        <ringGeometry args={[1.9, 2.1, 48]} />
        <meshBasicMaterial color="#00ff41" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      <pointLight color="#00ff41" intensity={3} distance={8} />
      <pointLight color="#00ff41" intensity={1} distance={4} position={[0, -2, 0]} />
    </group>
  );
}
function DroneScene() {
  return (
    <Canvas camera={{ position: [3, 3, 7], fov: 48 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
      <ambientLight intensity={0.05} />
      <WireframeDrone />
    </Canvas>
  );
}

function RadarRings() {
  const groupRef = useRef();
  const sweepRef = useRef();
  const blipRefs = [useRef(), useRef(), useRef(), useRef(), useRef()];
  const rings = [1.8, 3.2, 4.6, 6.0, 7.4];
  const blips = [[2.6, 0.8], [4.9, -1.4], [3.5, 2.8], [6.1, -0.6], [5.5, 1.9]];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (sweepRef.current) sweepRef.current.rotation.z = t * 0.9;
    if (groupRef.current) groupRef.current.rotation.y = t * 0.03;
    // pulse blips as sweep passes
    blipRefs.forEach((r, i) => {
      if (r.current) {
        const angle = blips[i][0] * 0.3;
        r.current.material.opacity = 0.3 + Math.abs(Math.sin(t * 0.9 - angle)) * 0.7;
        const s = 1 + Math.abs(Math.sin(t * 0.9 - angle)) * 0.6;
        r.current.scale.setScalar(s);
      }
    });
  });

  return (
    <group ref={groupRef} rotation={[Math.PI / 2.2, 0, 0]}>
      {/* concentric rings */}
      {rings.map((r, i) => (
        <mesh key={i}>
          <ringGeometry args={[r - 0.018, r + 0.018, 128]} />
          <meshBasicMaterial color="#00ff41" transparent opacity={0.18 - i * 0.025} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* sweep wedge — gradient-like layered arcs */}
      <group ref={sweepRef}>
        {[0.22, 0.14, 0.07, 0.03].map((op, i) => (
          <mesh key={i}>
            <ringGeometry args={[0, 7.4, 80, 1, 0, Math.PI * (0.28 - i * 0.06)]} />
            <meshBasicMaterial color="#00ff41" transparent opacity={op} side={THREE.DoubleSide} />
          </mesh>
        ))}
        {/* bright leading edge line */}
        <line>
          <bufferGeometry setFromPoints={[new THREE.Vector3(0,0,0), new THREE.Vector3(7.4,0,0)]} />
          <lineBasicMaterial color="#00ff41" transparent opacity={0.6} />
        </line>
      </group>

      {/* crosshairs */}
      {[0, Math.PI/2, Math.PI/4, -Math.PI/4].map((rot, i) => (
        <group key={i} rotation={[0, 0, rot]}>
          <line>
            <bufferGeometry setFromPoints={[new THREE.Vector3(-7.8,0,0), new THREE.Vector3(7.8,0,0)]} />
            <lineBasicMaterial color="#00ff41" transparent opacity={i < 2 ? 0.12 : 0.05} />
          </line>
        </group>
      ))}

      {/* blip dots with pulse rings */}
      {blips.map(([x, y], i) => (
        <group key={i} position={[x, y, 0]}>
          <mesh ref={blipRefs[i]}>
            <circleGeometry args={[0.09, 8]} />
            <meshBasicMaterial color="#00ff41" transparent opacity={0.9} />
          </mesh>
          <mesh>
            <ringGeometry args={[0.14, 0.18, 16]} />
            <meshBasicMaterial color="#00ff41" transparent opacity={0.25} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* center dot */}
      <mesh>
        <circleGeometry args={[0.12, 16]} />
        <meshBasicMaterial color="#00ff41" transparent opacity={0.8} />
      </mesh>

      <pointLight color="#00ff41" intensity={1.5} distance={12} />
    </group>
  );
}
function RadarScene() {
  return (
    <Canvas camera={{ position: [0, 0, 13], fov: 48 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
      <RadarRings />
    </Canvas>
  );
}

function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}



export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  const [sec1Ref, sec1Visible] = useInView();
  const [sec2Ref, sec2Visible] = useInView();
  const [sec3Ref, sec3Visible] = useInView();
  const [sec4Ref, sec4Visible] = useInView();
  const [sec5Ref, sec5Visible] = useInView();
  const [sec6Ref, sec6Visible] = useInView();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    const onMouse = (e) => {
      if (!heroRef.current) return;
      const r = heroRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - r.left) / r.width - 0.5,
        y: (e.clientY - r.top) / r.height - 0.5,
      });
    };
    window.addEventListener('scroll', onScroll);
    window.addEventListener('mousemove', onMouse);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <div className="bg-black text-white">

      {/* Classification Bar */}
      <div className="bg-red-900 py-1.5 text-center">
        <span className="font-mono text-[10px] tracking-[3px] uppercase text-white/90">
          CLASSIFIED · MINISTRY OF DEFENCE · GOVERNMENT OF INDIA · AUTHORIZED PERSONNEL ONLY
        </span>
      </div>

      {/* Nav */}
      <nav className={`fixed top-7 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/90 backdrop-blur-xl border-b border-white/10' : ''}`}>
        <div style={{ width: '100%', maxWidth: '1800px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '4rem', paddingRight: '4rem' }} className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WavingFlag width={60} height={42} />
            <div>
              <div className="font-display font-bold text-xl tracking-widest text-white">TRINETRA</div>
              <div className="font-mono text-[9px] text-white/50 uppercase tracking-widest">त्रिनेत्र · AI Border Surveillance</div>
            </div>
          </div>
          <Link to="/login" className="btn-tactical text-sm px-6 py-2.5">ACCESS SYSTEM</Link>
        </div>
      </nav>

      {/* ── SECTION 1 · HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden" style={{ background: '#00020a' }}>

        {/* 3D fills entire bg — globe offset right via camera */}
        <div className="absolute inset-0">
          <HeroScene />
        </div>

        {/* left edge fade so text is readable */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to right, rgba(0,2,10,0.92) 0%, rgba(0,2,10,0.7) 35%, rgba(0,2,10,0.15) 60%, transparent 100%)'
        }} />
        {/* bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #000)' }} />
        {/* top fade */}
        <div className="absolute top-0 left-0 right-0 h-20 pointer-events-none" style={{ background: 'linear-gradient(to top, transparent, rgba(0,0,0,0.6))' }} />

        {/* TEXT — left aligned, takes ~45% width */}
        <div className="relative z-10 w-full max-w-[1800px] mx-auto px-16 py-32">
          <div className="max-w-xl animate-fade-in-up">

            {/* eyebrow */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-px bg-green-500/60" />
              <span className="font-mono text-[10px] tracking-[4px] text-green-400/80 uppercase">AI Border Surveillance System</span>
            </div>

            {/* main title */}
            <h1 className="font-display font-bold leading-none text-white mb-5" style={{
              fontSize: 'clamp(4.5rem, 10vw, 9rem)',
              textShadow: '0 0 80px rgba(80,140,255,0.35), 0 2px 0 rgba(255,255,255,0.04)'
            }}>
              TRINE<span style={{ color: '#d4af37' }}>TRA</span>
            </h1>

            {/* devanagari + subtitle */}
            <p className="font-mono text-white/40 text-sm uppercase tracking-[6px] mb-2">त्रिनेत्र</p>
            <p className="font-mono text-white/55 text-base uppercase tracking-[4px] mb-10">
              The Third Eye of India
            </p>

            {/* divider */}
            <div className="w-16 h-px bg-gradient-to-r from-green-500/50 to-transparent mb-10" />

            {/* stats row */}
            <div className="flex items-center gap-8 mb-5">
              {[
                { val: '3',      lbl: 'Active Sectors' },
                { val: '<2s',    lbl: 'Alert Time' },
                { val: '24/7',   lbl: 'Monitoring' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="font-display text-2xl font-bold text-white">{s.val}</div>
                  <div className="font-mono text-[9px] text-white/35 uppercase tracking-widest">{s.lbl}</div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              to="/login"
              className="btn-tactical btn-glow inline-flex items-center gap-3 text-sm py-4 px-10 hover:scale-105 transition-transform"
            >
              ACCESS COMMAND CENTER <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-px h-10 bg-gradient-to-b from-white/0 to-white/25" />
          <span className="font-mono text-[9px] text-white/20 uppercase tracking-widest">Scroll</span>
        </div>
      </section>

      {/* ── SECTION 2 · SURVEILLANCE ── */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden" style={{ background: '#00050a' }}>
        {/* radar 3D bg */}
        <div className="absolute inset-0 pointer-events-none"><RadarScene /></div>
        {/* dark overlay so content is readable */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 50%, rgba(0,5,10,0.55) 0%, rgba(0,5,10,0.88) 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #000)' }} />

        <div className="relative z-10 w-full max-w-[1800px] mx-auto px-16 py-10">
          <div ref={sec1Ref} className="grid md:grid-cols-2 gap-10 items-center">

            {/* LEFT — mock CCTV feed panel */}
            <div className={`transition-all duration-700 ${sec1Visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-16'}`}>
              {/* panel header */}
              <div className="border border-green-900/60 bg-black/70">
                <div className="flex items-center justify-between px-4 py-2 border-b border-green-900/40">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="font-mono text-[10px] text-green-400 tracking-widest">SECTOR ALPHA · LIVE</span>
                  </div>
                  <span className="font-mono text-[9px] text-white/30">CAM-01 · NORTH BORDER</span>
                </div>

                {/* fake video feed */}
                <div className="relative aspect-video bg-black overflow-hidden">
                  {/* scanline overlay */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.015) 2px, rgba(0,255,65,0.015) 4px)'
                  }} />
                  {/* fake terrain */}
                  <div className="absolute inset-0" style={{
                    background: 'linear-gradient(180deg, #0a1a0a 0%, #0d2010 40%, #081508 100%)'
                  }} />
                  {/* horizon line */}
                  <div className="absolute left-0 right-0" style={{ top: '45%', height: '1px', background: 'rgba(0,255,65,0.15)' }} />
                  {/* detection boxes */}
                  <div className="absolute border border-green-400/70" style={{ top: '28%', left: '22%', width: '8%', height: '18%' }}>
                    <span className="absolute -top-4 left-0 font-mono text-[8px] text-green-400">PERSON 94%</span>
                  </div>
                  <div className="absolute border border-yellow-400/70" style={{ top: '35%', left: '58%', width: '14%', height: '12%' }}>
                    <span className="absolute -top-4 left-0 font-mono text-[8px] text-yellow-400">VEHICLE 87%</span>
                  </div>
                  {/* scanning line animation */}
                  <div className="absolute left-0 right-0 h-px" style={{
                    background: 'linear-gradient(90deg, transparent, rgba(0,255,65,0.6), transparent)',
                    animation: 'scanning 3s linear infinite'
                  }} />
                  {/* corner brackets */}
                  {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
                    <div key={i} className={`absolute ${pos} w-4 h-4 border-green-500/50`} style={{
                      borderTopWidth:    i < 2 ? '1px' : '0',
                      borderBottomWidth: i >= 2 ? '1px' : '0',
                      borderLeftWidth:   i % 2 === 0 ? '1px' : '0',
                      borderRightWidth:  i % 2 === 1 ? '1px' : '0',
                    }} />
                  ))}
                  {/* threat badge */}
                  <div className="absolute top-3 right-3 bg-red-900/80 border border-red-500/60 px-2 py-0.5">
                    <span className="font-mono text-[9px] text-red-400 tracking-widest">THREAT · HIGH</span>
                  </div>
                </div>

                {/* bottom status bar */}
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="font-mono text-[9px] text-white/30">2 OBJECTS DETECTED</span>
                  <span className="font-mono text-[9px] text-green-500/60">30 FPS · 480p</span>
                </div>
              </div>

              {/* mini sector grid */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {['ALPHA · LIVE', 'BRAVO · LIVE', 'CHARLIE · IDLE'].map((s, i) => (
                  <div key={i} className={`border px-3 py-2 ${i < 2 ? 'border-green-900/50 bg-green-950/20' : 'border-white/10 bg-black/40'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${i < 2 ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`} />
                      <span className="font-mono text-[8px] text-white/50">{s}</span>
                    </div>
                    <div className="font-mono text-[9px] text-white/25">CAM-0{i+1}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — feature content */}
            <div className={`transition-all duration-700 delay-200 ${sec1Visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-6 h-px bg-green-500/60" />
                <span className="font-mono text-[10px] tracking-[4px] text-green-400 uppercase">Surveillance Intelligence</span>
              </div>
              <h2 className="font-display text-5xl font-bold text-white mb-5 text-3d">Advanced Threat Detection</h2>
              <p className="text-white/50 font-mono text-sm leading-relaxed mb-10">
                Every frame analyzed in real-time. Threats identified, classified and escalated before they breach the perimeter.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Eye,    color: 'green',  label: 'VISION AI',     title: 'YOLOv8 Detection',    desc: 'Persons, vehicles, animals — sub-100ms inference on every frame' },
                  { icon: Zap,    color: 'yellow', label: 'REAL-TIME',     title: 'Instant Analysis',    desc: 'WebSocket push to dashboard and field devices in under 2 seconds' },
                  { icon: Shield, color: 'red',    label: 'AUTO RESPONSE', title: 'Threat Escalation',   desc: 'HIGH / MEDIUM / LOW classification with automated ntfy.sh alerts' },
                ].map((item, i) => (
                  <div key={i}
                    className={`flex gap-4 p-4 border transition-all duration-500 hover:-translate-x-1 ${
                      item.color === 'green'  ? 'border-green-900/40  bg-green-950/10  hover:border-green-600/40' :
                      item.color === 'yellow' ? 'border-yellow-900/40 bg-yellow-950/10 hover:border-yellow-600/40' :
                                               'border-red-900/40    bg-red-950/10    hover:border-red-600/40'
                    } ${sec1Visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
                    style={{ transitionDelay: `${i * 120 + 400}ms` }}
                  >
                    <div className={`w-10 h-10 border flex items-center justify-center shrink-0 ${
                      item.color === 'green'  ? 'border-green-800  text-green-400' :
                      item.color === 'yellow' ? 'border-yellow-800 text-yellow-400' :
                                               'border-red-800    text-red-400'
                    }`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`font-mono text-[9px] tracking-widest mb-0.5 ${
                        item.color === 'green' ? 'text-green-500' : item.color === 'yellow' ? 'text-yellow-500' : 'text-red-500'
                      }`}>{item.label}</div>
                      <div className="font-display text-base font-bold text-white mb-0.5">{item.title}</div>
                      <div className="font-mono text-[11px] text-white/40 leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 3 · AUTONOMOUS OPS ── */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden" style={{ background: '#020800' }}>
        <div className="absolute inset-0 pointer-events-none"><DroneScene /></div>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 80% at 70% 50%, transparent 30%, #020800 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #000)' }} />
        <div style={{ width:'100%', maxWidth:'1800px', margin:'0 auto', padding:'2.5rem 4rem', position:'relative', zIndex:10 }}>
          <div ref={sec2Ref} className="max-w-4xl mx-auto text-center">
            <div className={`font-mono text-[10px] tracking-[4px] text-green-400 uppercase mb-4 transition-all duration-700 ${sec2Visible ? 'opacity-100' : 'opacity-0'}`}>AUTONOMOUS OPERATIONS</div>
            <h2 className={`font-display text-6xl font-bold text-white mb-6 text-3d transition-all duration-700 ${sec2Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>24/7 Without Fatigue</h2>
            <p className={`text-white/50 text-lg leading-relaxed mb-5 font-mono transition-all duration-700 delay-100 ${sec2Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>Replacing costly drone patrols with AI surveillance that never sleeps, never blinks.</p>
            <div className="flex flex-col items-center gap-5">
              {[
                { icon: Radar,     label: 'COVERAGE', text: 'Continuous 360° perimeter monitoring' },
                { icon: Satellite, label: 'FUSION',   text: 'Multi-sensor data fusion in real-time' },
                { icon: Lock,      label: 'COMMS',    text: 'End-to-end encrypted communications' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-4 transition-all duration-500 ${sec2Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${i*120+300}ms` }}>
                  <div className="w-10 h-10 border border-green-800 flex items-center justify-center shrink-0"><item.icon className="w-5 h-5 text-green-400" /></div>
                  <div className="text-left">
                    <div className="font-mono text-[9px] text-green-500 tracking-widest mb-0.5">{item.label}</div>
                    <div className="text-white/70 text-sm">{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 · TECH STACK ── */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden" style={{ background: '#050400' }}>
        <div className="absolute inset-0 pointer-events-none"><DataScene /></div>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 20%, #050400 90%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #000)' }} />
        <div style={{ width:'100%', maxWidth:'1800px', margin:'0 auto', padding:'2.5rem 4rem', position:'relative', zIndex:10 }}>
          <div ref={sec3Ref} className="max-w-5xl mx-auto text-center">
            <div className={`font-mono text-[10px] tracking-[4px] text-yellow-500 uppercase mb-4 transition-all duration-700 ${sec3Visible ? 'opacity-100' : 'opacity-0'}`}>TECHNOLOGY STACK</div>
            <h2 className={`font-display text-6xl font-bold text-white mb-4 text-3d transition-all duration-700 ${sec3Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>Built for the Battlefield</h2>
            <p className={`text-white/50 text-lg mb-6 font-mono transition-all duration-700 delay-100 ${sec3Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>Enterprise-grade AI on defence-hardened infrastructure</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
              {[
                { label: 'Vision Model', value: 'YOLOv8s',          sub: 'Ultralytics' },
                { label: 'Backend',      value: 'FastAPI',           sub: 'Python 3.10+' },
                { label: 'Real-time',    value: 'WebSocket',         sub: 'Bi-directional' },
                { label: 'Alerts',       value: 'ntfy.sh',           sub: 'Push notify' },
              ].map((item, i) => (
                <div key={i} className={`border border-yellow-900/50 bg-black/60 p-6 hover:border-yellow-500/40 hover:-translate-y-2 transition-all duration-500 ${sec3Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: `${i*100+200}ms` }}>
                  <div className="font-mono text-[9px] text-yellow-600 uppercase tracking-widest mb-3">{item.label}</div>
                  <div className="font-display text-2xl font-bold text-white mb-1">{item.value}</div>
                  <div className="font-mono text-[9px] text-white/30">{item.sub}</div>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: 'Detection Speed', value: '<100ms' },
                { label: 'Sectors Monitored', value: '3 Active' },
                { label: 'Uptime', value: '99.9%' },
              ].map((item, i) => (
                <div key={i} className={`border-l-2 border-yellow-700 pl-4 text-left transition-all duration-500 ${sec3Visible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${i*100+600}ms` }}>
                  <div className="font-mono text-[9px] text-yellow-600 uppercase tracking-widest mb-1">{item.label}</div>
                  <div className="font-display text-3xl font-bold text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5 · BORDER STATS ── */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden" style={{ background: '#080200' }}>
        <div className="absolute inset-0 pointer-events-none"><TerrainScene /></div>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 60%, transparent 20%, #080200 85%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #000)' }} />
        <div style={{ width:'100%', maxWidth:'1800px', margin:'0 auto', padding:'2.5rem 4rem', position:'relative', zIndex:10 }}>
          <div ref={sec4Ref} className="max-w-4xl mx-auto text-center">
            <div className={`font-mono text-[10px] tracking-[4px] text-orange-500 uppercase mb-4 transition-all duration-700 ${sec4Visible ? 'opacity-100' : 'opacity-0'}`}>BORDER INTELLIGENCE</div>
            <h2 className={`font-display text-6xl font-bold text-white mb-6 text-3d transition-all duration-700 ${sec4Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>Protecting Every Inch of Bharat</h2>
            <p className={`text-white/50 text-xl leading-relaxed mb-6 font-mono transition-all duration-700 delay-150 ${sec4Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              India has over <span className="text-orange-400 font-bold">15,106 km</span> of land borders across <span className="text-orange-400 font-bold">7 nations</span>. TRINETRA makes every meter intelligent.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: '15,106', unit: 'KM', label: 'Land Border' },
                { value: '7,516',  unit: 'KM', label: 'Coastline' },
                { value: '24/7',   unit: '',   label: 'Monitoring' },
                { value: '<2s',    unit: '',   label: 'Alert Time' },
              ].map((item, i) => (
                <div key={i} className={`border border-orange-900/40 bg-black/50 p-6 transition-all duration-500 hover:border-orange-500/40 ${sec4Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: `${i*120+300}ms` }}>
                  <div className="font-display text-4xl font-bold text-orange-400 mb-1">{item.value}<span className="text-lg text-orange-600 ml-1">{item.unit}</span></div>
                  <div className="font-mono text-[9px] text-white/40 uppercase tracking-widest">{item.label}</div>
                </div>
              ))}
            </div>
            <div className={`mt-12 transition-all duration-700 delay-700 ${sec4Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <Link to="/login" className="btn-tactical btn-glow inline-flex items-center gap-3 text-sm py-4 px-10 hover:scale-105 transition-transform">
                ENTER COMMAND CENTER <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6 · REAL-TIME MONITORING ── */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden" style={{ background: '#000a10' }}>
        <div className="absolute inset-0 pointer-events-none"><HudScene /></div>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 25%, #000a10 90%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #000)' }} />
        <div style={{ width:'100%', maxWidth:'1800px', margin:'0 auto', padding:'2.5rem 4rem', position:'relative', zIndex:10 }}>
          <div ref={sec5Ref} className="max-w-5xl mx-auto text-center">
            <div className={`font-mono text-[10px] tracking-[4px] text-cyan-400 uppercase mb-4 transition-all duration-700 ${sec5Visible ? 'opacity-100' : 'opacity-0'}`}>LIVE OPERATIONS</div>
            <h2 className={`font-display text-6xl font-bold text-white mb-4 text-3d transition-all duration-700 ${sec5Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>Real-time Monitoring</h2>
            <p className={`text-white/50 text-lg mb-6 font-mono transition-all duration-700 delay-100 ${sec5Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>Continuous surveillance with instant threat detection and response</p>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { icon: Target,   label: 'PRECISION TRACKING', title: 'Precision Tracking', desc: 'Advanced algorithms track movement patterns and flag anomalies across vast border regions in real-time' },
                { icon: Activity, label: 'LIVE ANALYTICS',     title: 'Live Analytics',     desc: 'Continuous data processing delivers actionable insights and predictive threat assessment' },
              ].map((item, i) => (
                <div key={i} className={`border border-cyan-900/50 bg-black/60 p-6 text-center hover:border-cyan-500/40 hover:-translate-y-2 transition-all duration-500 ${sec5Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: `${i*200+200}ms` }}>
                  <div className="font-mono text-[9px] text-cyan-500 tracking-widest mb-4">{item.label}</div>
                  <div className="w-12 h-12 border border-cyan-800 flex items-center justify-center mb-5 mx-auto"><item.icon className="w-6 h-6 text-cyan-400" /></div>
                  <h3 className="font-display text-2xl font-bold text-white mb-4">{item.title}</h3>
                  <p className="text-white/45 leading-relaxed font-mono text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 7 · FINAL CTA ── */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden" style={{ background: '#080600' }}>
        <div className="absolute inset-0 pointer-events-none"><CtaScene /></div>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, transparent 20%, #080600 90%)' }} />
        <div style={{ width:'100%', maxWidth:'1800px', margin:'0 auto', padding:'2.5rem 4rem', position:'relative', zIndex:10 }}>
          <div ref={sec6Ref} className="max-w-4xl mx-auto text-center">
            <div className={`font-mono text-[10px] tracking-[4px] text-yellow-500 uppercase mb-4 transition-all duration-700 ${sec6Visible ? 'opacity-100' : 'opacity-0'}`}>MISSION READY</div>
            <h2 className={`font-display text-7xl font-bold text-white mb-6 text-3d transition-all duration-700 ${sec6Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>Join the Future of Border Security</h2>
            <p className={`text-white/50 text-xl leading-relaxed mb-5 font-mono transition-all duration-700 delay-150 ${sec6Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              AI-driven surveillance. Intelligent threat detection. Zero compromise.
            </p>
            <div className={`transition-all duration-700 delay-300 ${sec6Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <Link to="/login" className="btn-tactical btn-glow inline-flex items-center gap-3 text-base py-5 px-14 hover:scale-110 transition-transform">
                ACCESS COMMAND CENTER <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-8">
        <div style={{ width: '100%', maxWidth: '1800px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '4rem', paddingRight: '4rem' }} className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">TRINETRA · Ministry of Defence · GOI</span>
          <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest text-center">Classified · Unauthorized Access Punishable Under IT Act 2000</span>
          <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">© 2025 Government of India</span>
        </div>
      </footer>

    </div>
  );
}
