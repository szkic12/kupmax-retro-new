'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface RollupImageProps {
  src: string;
  alt: string;
  linkTo: string;
}

export default function RollupImage({ src, alt, linkTo }: RollupImageProps) {
  return (
    <motion.div
      className="relative w-full h-64 rounded-lg overflow-hidden group"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={linkTo} target="_blank" className="block w-full h-full">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </Link>
    </motion.div>
  );
}
