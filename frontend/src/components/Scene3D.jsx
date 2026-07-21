import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Environment, Sparkles } from '@react-three/drei';

function AbstractMedicalShape() {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.1;
      meshRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <mesh ref={meshRef}>
        {/* An abstract, organic pill/capsule or cell-like shape */}
        <capsuleGeometry args={[1, 2.5, 32, 64]} />
        <MeshDistortMaterial
          color="#0f766e" // Teal 700
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transmission={0.9} // Glass-like
          ior={1.5}
          thickness={1}
        />
      </mesh>
    </Float>
  );
}

function FloatingOrbs() {
  return (
    <group>
      <Float speed={1.5} rotationIntensity={2} floatIntensity={3} position={[-4, 2, -5]}>
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} roughness={0.2} />
        </mesh>
      </Float>
      <Float speed={2} rotationIntensity={1} floatIntensity={2} position={[3, -2, -3]}>
        <mesh>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="#14b8a6" emissive="#14b8a6" emissiveIntensity={0.8} roughness={0.1} />
        </mesh>
      </Float>
    </group>
  );
}

export default function Scene3D() {
  return (
    <div className="absolute inset-0 z-0 w-full h-full pointer-events-none opacity-60">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
        <spotLight position={[-10, -10, -5]} intensity={0.5} color="#0ea5e9" />
        
        <AbstractMedicalShape />
        <FloatingOrbs />
        
        <Sparkles count={100} scale={12} size={2} speed={0.4} opacity={0.2} color="#14b8a6" />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
