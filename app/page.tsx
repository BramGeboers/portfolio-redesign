"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useReducer, useMemo } from "react";
import type { Mesh, Vector3 } from "three";
import type { RapierRigidBody } from "@react-three/rapier";
import type { GLTF } from "three-stdlib";
import {
  useGLTF,
  MeshTransmissionMaterial,
  Environment,
  Lightformer,
} from "@react-three/drei";
import {
  Physics,
  RigidBody,
  CuboidCollider,
  BallCollider,
} from "@react-three/rapier";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import { easing } from "maath";
import { useFrame } from "@react-three/fiber";

// Types
interface ConnectorMaterial {
  color: string;
  roughness: number;
  accent?: boolean;
}

interface ConnectorProps extends Partial<ConnectorMaterial> {
  position?: [number, number, number];
  children?: React.ReactNode;
}

interface ModelProps {
  children?: React.ReactNode;
  color?: string;
  roughness?: number;
}

interface GLTFResult extends GLTF {
  nodes: {
    connector: THREE.Mesh;
  };
  materials: {
    base: THREE.MeshStandardMaterial;
  };
}

// Constants
const ACCENTS = ["#4060ff", "#20ffa0", "#ff4060", "#ffcc00"] as const;

const shuffle = (accent: number): ConnectorMaterial[] => [
  { color: "#444", roughness: 0.1 },
  { color: "#444", roughness: 0.75 },
  { color: "#444", roughness: 0.75 },
  { color: "white", roughness: 0.1 },
  { color: "white", roughness: 0.75 },
  { color: "white", roughness: 0.1 },
  { color: ACCENTS[accent], roughness: 0.1, accent: true },
  { color: ACCENTS[accent], roughness: 0.75, accent: true },
  { color: ACCENTS[accent], roughness: 0.1, accent: true },
];

export default function Home() {
  return (
    <main>
      <header className="w-full p-8 font-instrument-serif flex justify-between items-center">
        <a href="/" className="text-5xl text-[#FFB3AF]" aria-label="Home">
          <span className="scale-x-[-1] inline-block translate-x-[8px] -translate-y-[2px]">
            B
          </span>
          g
        </a>

        <a href="/#footer" className="text-3xl">
          Contact
        </a>
      </header>

      <div className="flex items-center justify-center max-w-6xl mx-auto h-[calc(100vh-112px)] gap-16">
        <div className="pointer-events-none relative z-10">
          <h2 className="text-2xl font-manrope">Developer</h2>
          <h1 className="text-[160px] leading-[130px] font-instrument-serif text-[#FFB3AF]">
            Bram <br />
            Geboers
          </h1>
        </div>

        <div className="w-[1920px] h-full absolute -z-10">
          <Scene />
        </div>
      </div>
    </main>
  );
}

// Canvas Scene Component
function Scene() {
  const [accent, click] = useReducer(
    (state: number) => (state + 1) % ACCENTS.length,
    0
  );
  const connectors = useMemo(() => shuffle(accent), [accent]);

  return (
    <Canvas
      onClick={click}
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: false }}
      camera={{ position: [600, 60, 25], fov: 17.5, near: 1, far: 30 }}
    >
      {/* <color attach="background" args={["#141622"]} /> */}
      <ambientLight intensity={0.4} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        intensity={1}
        castShadow
      />
      <Physics gravity={[0, 0, 0]}>
        <Pointer />
        {connectors.map((props, i) => (
          <Connector key={i} {...props} />
        ))}
        <Connector position={[10, 10, 5]}>
          <Model>
            <MeshTransmissionMaterial
              clearcoat={1}
              thickness={0.1}
              anisotropicBlur={0.1}
              chromaticAberration={0.1}
              samples={8}
              resolution={512}
            />
          </Model>
        </Connector>
      </Physics>
      {/* <EffectComposer enableNormalPass multisampling={8}>
      <N8AO distanceFalloff={1} aoRadius={1} intensity={4} />
      </EffectComposer> */}
      <Environment resolution={64}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer
            form="circle"
            intensity={4}
            rotation-x={Math.PI / 2}
            position={[0, 5, -9]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-5, 1, -1]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-5, -1, -1]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={-Math.PI / 2}
            position={[10, 1, 0]}
            scale={8}
          />
        </group>
      </Environment>
    </Canvas>
  );
}

function Connector({
  position,
  children,
  accent,
  color,
  roughness,
}: ConnectorProps) {
  const api = useRef<RapierRigidBody>(null);
  const vec = useMemo(() => new THREE.Vector3(), []);

  const pos = useMemo<[number, number, number]>(() => {
    if (position) return position;
    const r = THREE.MathUtils.randFloatSpread;
    return [r(10), r(10), r(10)];
  }, [position]);

  useFrame((state, delta) => {
    const clampedDelta = Math.min(0.1, delta);
    const rigidBody = api.current;

    if (rigidBody) {
      const translation = rigidBody.translation();
      vec.set(translation.x, translation.y, translation.z);
      vec.negate().multiplyScalar(0.2);
      rigidBody.applyImpulse(vec, true);
    }
  });

  return (
    <RigidBody
      linearDamping={4}
      angularDamping={1}
      friction={0.1}
      position={pos}
      ref={api}
      colliders={false}
    >
      <CuboidCollider args={[0.38, 1.27, 0.38]} />
      <CuboidCollider args={[1.27, 0.38, 0.38]} />
      <CuboidCollider args={[0.38, 0.38, 1.27]} />
      {children || <Model color={color} roughness={roughness} />}
      {accent && color && (
        <pointLight intensity={4} distance={2.5} color={color} />
      )}
    </RigidBody>
  );
}

function Pointer() {
  const ref = useRef<RapierRigidBody>(null);
  const vec = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ mouse, viewport }) => {
    const rigidBody = ref.current;
    if (rigidBody) {
      vec.set(
        (mouse.x * viewport.width) / 2,
        (mouse.y * viewport.height) / 2,
        0
      );
      rigidBody.setNextKinematicTranslation(vec);
    }
  });

  return (
    <RigidBody
      position={[0, 0, 0]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
    >
      <BallCollider args={[1]} />
    </RigidBody>
  );
}

function Model({ children, color = "white", roughness = 0 }: ModelProps) {
  const ref = useRef<Mesh>(null);
  const { nodes, materials } = useGLTF(
    "/c-transformed.glb"
  ) as unknown as GLTFResult;

  useFrame((state, delta) => {
    const mesh = ref.current;
    if (mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
      easing.dampC(mesh.material.color, color, 0.2, delta);
    }
  });

  return (
    <mesh
      ref={ref}
      castShadow
      receiveShadow
      scale={10}
      geometry={nodes.connector.geometry}
    >
      <meshStandardMaterial
        metalness={0.2}
        roughness={roughness}
        map={materials.base.map}
      />
      {children}
    </mesh>
  );
}

// Preload the GLTF model
useGLTF.preload("/c-transformed.glb");
