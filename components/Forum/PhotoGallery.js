'use client';
// Zdjęcia we wpisie: miniatury, kliknięcie otwiera duży podgląd (strzałki, Esc, przesuwanie palcem).
import { useEffect, useRef, useState } from 'react';

export default function PhotoGallery({ photos }) {
  const [open, setOpen] = useState(-1);
  const touch = useRef(null);
  const n = photos?.length || 0;

  useEffect(() => {
    if (open < 0) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(-1);
      if (e.key === 'ArrowRight') setOpen((i) => (i + 1) % n);
      if (e.key === 'ArrowLeft') setOpen((i) => (i - 1 + n) % n);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, n]);

  if (!n) return null;

  const go = (d) => setOpen((i) => (i + d + n) % n);

  return (
    <div className="photo-gallery">
      {photos.map((url, i) => (
        <button type="button" key={url} className="pg-thumb" onClick={() => setOpen(i)} aria-label={`Zdjęcie ${i + 1} z ${n}`}>
          <img src={url} alt="" loading="lazy" />
        </button>
      ))}

      {open >= 0 && (
        <div
          className="pg-box"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(-1)}
          onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - (touch.current ?? 0);
            if (Math.abs(dx) > 50 && n > 1) go(dx < 0 ? 1 : -1);
          }}
        >
          <img src={photos[open]} alt="" onClick={(e) => e.stopPropagation()} />
          <button type="button" className="pg-close" onClick={() => setOpen(-1)} aria-label="Zamknij">✕</button>
          {n > 1 && (
            <>
              <button type="button" className="pg-nav pg-prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Poprzednie">‹</button>
              <button type="button" className="pg-nav pg-next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Następne">›</button>
              <span className="pg-count">{open + 1} / {n}</span>
            </>
          )}
        </div>
      )}

      <style jsx global>{`
        .photo-gallery { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 0; }
        .pg-thumb {
          width: 120px; height: 120px; padding: 0; cursor: zoom-in; overflow: hidden; background: #fff;
          border: 2px solid; border-color: #808080 #fff #fff #808080;
        }
        .pg-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        @media (max-width: 480px) { .pg-thumb { width: calc(33% - 6px); height: auto; aspect-ratio: 1; } }
        .pg-box {
          position: fixed; inset: 0; z-index: 10000; background: rgba(0, 0, 0, 0.88);
          display: flex; align-items: center; justify-content: center; padding: 16px;
        }
        .pg-box img { max-width: 100%; max-height: 100%; object-fit: contain; cursor: default; }
        .pg-box button {
          position: absolute; background: #c0c0c0; color: #000; cursor: pointer;
          border: 2px solid; border-color: #fff #808080 #808080 #fff; font-size: 22px; line-height: 1;
        }
        .pg-close { top: 12px; right: 12px; width: 40px; height: 40px; }
        .pg-nav { top: 50%; transform: translateY(-50%); width: 44px; height: 60px; font-size: 34px; }
        .pg-prev { left: 8px; }
        .pg-next { right: 8px; }
        .pg-count { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); color: #fff; font-size: 14px; }
      `}</style>
    </div>
  );
}
