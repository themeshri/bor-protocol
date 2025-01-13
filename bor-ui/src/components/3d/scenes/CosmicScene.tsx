import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

export default function CosmicScene({ color = "#8855ff" }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
      groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
      <group ref={groupRef}>
        <mesh castShadow receiveShadow>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={color}
            roughness={0.1}
            metalness={0.8}
            envMapIntensity={1}
          />
        </mesh>
        <mesh position={[0, 0, 0]} scale={2}>
          <sphereGeometry args={[1, 4, 4]} />
          <meshStandardMaterial
            color={color}
            wireframe
            transparent
            opacity={0.2}
          />
        </mesh>
      </group>
    </Float>
  );
}