'use client';

import { ReactNode, useRef, useState, useEffect, useCallback } from 'react';
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
  newTabUrl?: string;
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
  newTabUrl
}: WindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [originalStyles, setOriginalStyles] = useState<any>(null);

  // Obsługa maksymalizacji
  const handleMaximize = useCallback(() => {
    if (!windowRef.current) return;

    const element = windowRef.current;

    if (!isMaximized) {
      // Zapisz oryginalne style
      setOriginalStyles({
        position: element.style.position,
        top: element.style.top,
        left: element.style.left,
        right: element.style.right,
        bottom: element.style.bottom,
        width: element.style.width,
        height: element.style.height,
        maxWidth: element.style.maxWidth,
        maxHeight: element.style.maxHeight,
        margin: element.style.margin,
        zIndex: element.style.zIndex,
        borderRadius: element.style.borderRadius,
        transform: element.style.transform
      });

      // Maksymalizuj
      element.style.position = 'fixed';
      element.style.top = '40px'; // Pod taskbarem
      element.style.left = '0';
      element.style.right = '0';
      element.style.bottom = '0';
      element.style.width = '100vw';
      element.style.height = 'calc(100vh - 40px)';
      element.style.maxWidth = '100vw';
      element.style.maxHeight = 'calc(100vh - 40px)';
      element.style.margin = '0';
      element.style.zIndex = '9999';
      element.style.borderRadius = '0';
      element.style.transform = 'none';

      setIsMaximized(true);
    } else {
      // Przywróć oryginalne style
      if (originalStyles) {
        element.style.position = originalStyles.position || '';
        element.style.top = originalStyles.top || '';
        element.style.left = originalStyles.left || '';
        element.style.right = originalStyles.right || '';
        element.style.bottom = originalStyles.bottom || '';
        element.style.width = originalStyles.width || width;
        element.style.height = originalStyles.height || height;
        element.style.maxWidth = originalStyles.maxWidth || '';
        element.style.maxHeight = originalStyles.maxHeight || '';
        element.style.margin = originalStyles.margin || '';
        element.style.zIndex = originalStyles.zIndex || '';
        element.style.borderRadius = originalStyles.borderRadius || '';
        element.style.transform = originalStyles.transform || '';
      }

      setIsMaximized(false);
    }
  }, [isMaximized, originalStyles, width, height]);

  // Obsługa ESC dla wyjścia z maksymalizacji
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMaximized) {
        handleMaximize();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMaximized, handleMaximize]);

  // Obsługa otwierania w nowej karcie
  const handleNewTab = () => {
    if (newTabUrl) {
      window.open(newTabUrl, '_blank');
    }
  };

  if (minimized) return null;

  return (
    <AnimatePresence>
      {!minimized && (
        <motion.div
          ref={windowRef}
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
          drag={!isMaximized}
          dragMomentum={false}
        >
          {/* Title Bar */}
          <div className="win95-titlebar cursor-move flex justify-between items-center">
            <div className="flex items-center gap-1 overflow-hidden">
              {icon && <span>{icon}</span>}
              <span className="truncate">{title}</span>
            </div>

            {/* Window Controls - nowe przyciski */}
            <div className="flex gap-[2px] flex-shrink-0">
              {/* Otwórz w nowej karcie */}
              {newTabUrl && (
                <button
                  className="w-[22px] h-[22px] flex items-center justify-center text-white font-bold text-[12px]"
                  style={{
                    background: '#22c55e',
                    border: '2px solid',
                    borderColor: '#fff #000 #000 #fff'
                  }}
                  onClick={handleNewTab}
                  title="Otwórz w nowej karcie"
                >
                  ↗
                </button>
              )}

              {/* Minimalizuj */}
              <button
                className="w-[22px] h-[22px] flex items-center justify-center font-bold text-[16px]"
                style={{
                  background: '#c0c0c0',
                  border: '2px solid',
                  borderColor: '#fff #000 #000 #fff'
                }}
                onClick={onMinimize}
                title="Minimalizuj"
              >
                −
              </button>

              {/* Maksymalizuj */}
              <button
                className="w-[22px] h-[22px] flex items-center justify-center font-bold text-[12px]"
                style={{
                  background: '#c0c0c0',
                  border: '2px solid',
                  borderColor: '#fff #000 #000 #fff'
                }}
                onClick={handleMaximize}
                title={isMaximized ? "Przywróć (ESC)" : "Maksymalizuj"}
              >
                {isMaximized ? '❐' : '□'}
              </button>

              {/* Zamknij */}
              <button
                className="w-[22px] h-[22px] flex items-center justify-center text-white font-bold text-[16px]"
                style={{
                  background: '#dc2626',
                  border: '2px solid',
                  borderColor: '#fff #000 #000 #fff'
                }}
                onClick={onClose}
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
