'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ModelProps {
  src: string;
}

function CharacterModel({ src }: ModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(src);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
    }
  });

  return <primitive ref={meshRef} object={scene} scale={1.5} />;
}

export default function RollupCharacter({ src }: ModelProps) {
  return (
    <div className="w-full h-full min-h-[300px] rounded-lg overflow-hidden bg-gradient-to-br from-pink-900 to-orange-900">
      <Canvas camera={{ position: [0, 1, 4], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.4} />
        <Suspense fallback={null}>
          <CharacterModel src={src} />
          <OrbitControls
            enableZoom={false}
            autoRotate
            autoRotateSpeed={0.3}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
