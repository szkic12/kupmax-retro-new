'use client';

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WindowProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: string;
  width?: string;
  height?: string;
  x?: number;
  y?: number;
  onClose?: () => void;
}

export default function Window({
  title,
  children,
  defaultOpen = true,
  icon,
  width = '600px',
  height = '400px',
  x = 50,
  y = 50,
  onClose
}: WindowProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {!isMinimized && (
        <motion.div
          className="win95-window absolute z-10"
          style={{
            width,
            height,
            left: x,
            top: y,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          drag
          dragMomentum={false}
        >
          {/* Title Bar */}
          <div className="win95-titlebar cursor-move">
            <div className="flex items-center gap-1">
              {icon && <span>{icon}</span>}
              <span>{title}</span>
            </div>
            <div className="flex gap-1">
              <button
                className="win95-button px-2 py-0 min-w-0 h-[14px] text-[10px] font-bold"
                onClick={() => setIsMinimized(true)}
              >
                _
              </button>
              <button
                className="win95-button px-2 py-0 min-w-0 h-[14px] text-[10px] font-bold"
                onClick={handleClose}
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="win95-content overflow-auto" style={{ height: 'calc(100% - 22px)' }}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
