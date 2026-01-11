'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClippyProps {
  onOpenChat: () => void;
}

export default function Clippy({ onOpenChat }: ClippyProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-12 right-4 z-40 cursor-pointer"
        initial={{ scale: 0, rotate: -180 }}
        animate={{
          scale: 1,
          rotate: 0,
          y: isHovered ? -10 : 0,
        }}
        exit={{ scale: 0, rotate: 180 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        onClick={onOpenChat}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Clippy SVG */}
        <div className="relative">
          {/* Speech Bubble */}
          {isHovered && (
            <motion.div
              className="absolute bottom-full right-0 mb-2 bg-yellow-100 border-2 border-black p-2 rounded-lg shadow-lg whitespace-nowrap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <div className="text-xs font-bold">
                Cześć! Potrzebujesz pomocy? 😊
              </div>
              <div className="absolute bottom-[-8px] right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-black" />
              <div className="absolute bottom-[-6px] right-[17px] w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-yellow-100" />
            </motion.div>
          )}

          {/* Clippy Character */}
          <motion.div
            animate={{
              rotate: isHovered ? [0, -5, 5, -5, 0] : 0,
            }}
            transition={{
              duration: 0.5,
              repeat: isHovered ? Infinity : 0,
              repeatDelay: 1,
            }}
          >
            <svg width="80" height="100" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Paperclip Body */}
              <path
                d="M30 10 C30 10, 25 10, 25 15 L25 75 C25 80, 30 85, 35 85 L45 85 C50 85, 55 80, 55 75 L55 25 C55 20, 52 15, 47 15 C42 15, 40 20, 40 25 L40 70 C40 73, 42 75, 45 75"
                stroke="#C0C0C0"
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M30 10 C30 10, 25 10, 25 15 L25 75 C25 80, 30 85, 35 85 L45 85 C50 85, 55 80, 55 75 L55 25 C55 20, 52 15, 47 15 C42 15, 40 20, 40 25 L40 70 C40 73, 42 75, 45 75"
                stroke="#808080"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />

              {/* Eyes */}
              <motion.circle
                cx="32"
                cy="30"
                r="3"
                fill="#000"
                animate={{
                  scaleY: isHovered ? [1, 0.1, 1] : 1,
                }}
                transition={{
                  duration: 0.2,
                  repeat: isHovered ? Infinity : 0,
                  repeatDelay: 3,
                }}
              />
              <motion.circle
                cx="42"
                cy="30"
                r="3"
                fill="#000"
                animate={{
                  scaleY: isHovered ? [1, 0.1, 1] : 1,
                }}
                transition={{
                  duration: 0.2,
                  repeat: isHovered ? Infinity : 0,
                  repeatDelay: 3,
                }}
              />

              {/* Mouth */}
              <path
                d="M32 40 Q37 45, 42 40"
                stroke="#000"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </motion.div>
        </div>

        {/* Close Button */}
        <button
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center hover:bg-red-700"
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
        >
          ×
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
