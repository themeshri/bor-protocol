import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

export default function WaveScene({ color = "#00ff88" }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<THREE.Mesh[]>([]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
      meshRefs.current.forEach((mesh, i) => {
        const t = state.clock.getElapsedTime();
        mesh.position.y = Math.sin(t + i * Math.PI * 0.5) * 0.5;
      });
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
      <group ref={groupRef}>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh
            key={i}
            ref={(el) => el && (meshRefs.current[i] = el)}
            position={[i - 2, 0, 0]}
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshStandardMaterial
              color={color}
              roughness={0.1}
              metalness={0.8}
              envMapIntensity={1}
            />
          </mesh>
        ))}
      </group>
    </Float>
  );
}