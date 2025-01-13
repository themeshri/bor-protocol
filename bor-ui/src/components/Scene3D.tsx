import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import { useScene } from '../contexts/ScenesContext';
import * as THREE from 'three';

function Box() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { scenes, activeScene } = useScene();
  const scene = scenes[activeScene];

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[0, 0, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color={scene.backgroundColor} metalness={0.5} roughness={0.2} />
    </mesh>
  );
}

function SceneContent() {
  const { scenes, activeScene } = useScene();
  const scene = scenes[activeScene];

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.15, 1]} />
      <Box />

      <ambientLight intensity={0.7} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.8} />

      <Environment
        preset={scene.environment as "sunset" | "night" | "dawn"}
        background
        blur={0.8}
      />

      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      <mesh
        rotation-x={-Math.PI / 2}
        position-y={-1}
        receiveShadow
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color={scene.backgroundColor}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
    </>
  );
}

export function Scene3D() {
  return (
    <Canvas>
      <SceneContent />
    </Canvas>
  );
}