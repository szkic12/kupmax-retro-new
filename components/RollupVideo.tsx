'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';

interface RollupVideoProps {
  src: string;
}

export default function RollupVideo({ src }: RollupVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <motion.div
      className="relative w-full h-64 rounded-lg overflow-hidden bg-black"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
}
