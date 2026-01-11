'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ModelProps {
  src: string;
}

function Model({ src }: ModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(src);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  return <primitive ref={meshRef} object={scene} scale={2} />;
}

export default function Rollup3D({ src }: ModelProps) {
  return (
    <div className="w-full h-full min-h-[300px] rounded-lg overflow-hidden bg-gradient-to-br from-purple-900 to-blue-900">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Suspense fallback={null}>
          <Model src={src} />
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        </Suspense>
      </Canvas>
    </div>
  );
}
