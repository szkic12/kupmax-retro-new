'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WindowProps {
  title: string;
  children: ReactNode;
  icon?: string;
  width?: string;
  height?: string;
  x?: number;
  y?: number;
  minimized?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onFocus?: () => void;
  isActive?: boolean;
  fullPageUrl?: string; // URL do pełnej strony (zamiast maksymalizacji)
}

export default function Window({
  title,
  children,
  icon,
  width = '600px',
  height = '400px',
  x = 50,
  y = 50,
  minimized = false,
  onClose,
  onMinimize,
  onFocus,
  isActive = false,
  fullPageUrl
}: WindowProps) {

  // Obsługa otwierania w nowej karcie
  const handleOpenFullPage = () => {
    if (fullPageUrl) {
      window.open(fullPageUrl, '_blank');
    }
  };

  if (minimized) return null;

  return (
    <AnimatePresence>
      {!minimized && (
        <motion.div
          className="win95-window absolute"
          style={{
            width,
            height,
            left: x,
            top: y,
            zIndex: isActive ? 100 : 10, // Aktywne okno na wierzchu
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          drag
          dragMomentum={false}
          onMouseDown={onFocus} // Kliknięcie ustawia okno jako aktywne
        >
          {/* Title Bar */}
          <div
            className="cursor-move flex justify-between items-center px-1 py-[2px] text-white text-sm font-bold"
            style={{
              background: isActive
                ? 'linear-gradient(90deg, #000080 0%, #1084d0 100%)'
                : 'linear-gradient(90deg, #808080 0%, #a0a0a0 100%)'
            }}
          >
            <div className="flex items-center gap-1 overflow-hidden">
              {icon && <span>{icon}</span>}
              <span className="truncate">{title}</span>
            </div>

            {/* Window Controls */}
            <div className="flex gap-[2px] flex-shrink-0">
              {/* Minimalizuj */}
              <button
                className="w-[22px] h-[22px] flex items-center justify-center font-bold text-[16px]"
                style={{
                  background: '#c0c0c0',
                  border: '2px solid',
                  borderColor: '#fff #000 #000 #fff'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onMinimize?.();
                }}
                title="Minimalizuj"
              >
                −
              </button>

              {/* Otwórz w nowej karcie (zamiast maksymalizacji) */}
              {fullPageUrl && (
                <button
                  className="w-[22px] h-[22px] flex items-center justify-center text-white font-bold text-[12px]"
                  style={{
                    background: '#22c55e',
                    border: '2px solid',
                    borderColor: '#fff #000 #000 #fff'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenFullPage();
                  }}
                  title="Otwórz w nowej karcie"
                >
                  ↗
                </button>
              )}

              {/* Zamknij */}
              <button
                className="w-[22px] h-[22px] flex items-center justify-center text-white font-bold text-[16px]"
                style={{
                  background: '#dc2626',
                  border: '2px solid',
                  borderColor: '#fff #000 #000 #fff'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose?.();
                }}
                title="Zamknij"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="win95-content overflow-auto" style={{ height: 'calc(100% - 28px)' }}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
