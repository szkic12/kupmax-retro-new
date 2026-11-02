'use client';
// Model 3D z pinezkami (model-viewer od Google: kręcenie palcem, przybliżanie, AR na telefonie).
// W trybie edycji stuknięcie w model wbija nową pinezkę; przeciągnięcie tylko obraca.
import { useEffect, useRef, useState } from 'react';
import VoicePlayer from '@/components/Forum/VoicePlayer';

const SRC = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js';
let loading = null;
function loadModelViewer() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (customElements.get('model-viewer')) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.type = 'module';
      s.src = SRC;
      s.onload = () => customElements.whenDefined('model-viewer').then(resolve);
      s.onerror = () => { loading = null; reject(new Error('model-viewer')); };
      document.head.appendChild(s);
    });
  }
  return loading;
}

const m = (v) => v.map((x) => `${x}m`).join(' ');

export function Model3D({ src, pins = [], editable = false, onPick, active = -1, onActive, height = 380 }) {
  const mv = useRef(null);
  const down = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadModelViewer().then(() => setReady(true)).catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    const el = mv.current;
    if (!el) return;
    const onLoad = () => setLoaded(true);
    const onErr = () => setFailed(true);
    el.addEventListener('load', onLoad);
    el.addEventListener('error', onErr);
    return () => { el.removeEventListener('load', onLoad); el.removeEventListener('error', onErr); };
  }, [ready]);

  // Wybrana pinezka: kamera patrzy na nią
  useEffect(() => {
    const el = mv.current;
    if (!el || !loaded) return;
    el.cameraTarget = active >= 0 && pins[active] ? m(pins[active].p) : 'auto auto auto';
  }, [active, loaded, pins]);

  const onDown = (e) => { down.current = [e.clientX, e.clientY]; };
  const onUp = (e) => {
    if (!editable || !down.current || !mv.current) return;
    const [x, y] = down.current;
    down.current = null;
    if (Math.hypot(e.clientX - x, e.clientY - y) > 6) return; // to było obracanie
    if (e.target.closest?.('.m3d-pin')) return;
    const hit = mv.current.positionAndNormalFromPoint(e.clientX, e.clientY);
    if (!hit) return;
    const p = [hit.position.x, hit.position.y, hit.position.z];
    const n = [hit.normal.x, hit.normal.y, hit.normal.z];
    onPick?.({ p, n });
  };

  if (failed) return <div className="m3d-box m3d-msg" style={{ height }}>⚠️ Nie da się pokazać modelu 3D w tej przeglądarce.</div>;

  return (
    <div className="m3d-box" style={{ height }} onPointerDown={onDown} onPointerUp={onUp}>
      {!ready && <div className="m3d-msg">⏳ Ładuję 3D…</div>}
      {ready && (
        <model-viewer
          ref={mv}
          src={src}
          camera-controls=""
          touch-action="pan-y"
          ar=""
          ar-modes="webxr scene-viewer quick-look"
          shadow-intensity="1"
          exposure="1"
          interaction-prompt="auto"
          style={{ width: '100%', height: '100%', background: '#f4f4f4' }}
        >
          {pins.map((pin, i) => (
            <button
              key={i}
              type="button"
              slot={`hotspot-${i}`}
              className={`m3d-pin ${i === active ? 'on' : ''}`}
              data-position={m(pin.p)}
              data-normal={m(pin.n)}
              data-visibility-attribute="visible"
              onClick={(e) => { e.stopPropagation(); onActive?.(i === active ? -1 : i); }}
              aria-label={`Pinezka ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
          {!loaded && <div slot="progress-bar" className="m3d-msg">⏳ Ładuję model…</div>}
        </model-viewer>
      )}
      {editable && loaded && <div className="m3d-tip">👆 Stuknij w model, żeby wbić pinezkę. Przeciągnij, żeby obrócić.</div>}

      <style jsx global>{`
        .m3d-box { position: relative; width: 100%; border: 2px solid; border-color: #808080 #fff #fff #808080; background: #f4f4f4; }
        .m3d-msg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #333; text-align: center; padding: 12px; }
        .m3d-tip { position: absolute; left: 8px; right: 8px; bottom: 8px; font-size: 12px; background: rgba(255,255,255,0.9); padding: 4px 8px; pointer-events: none; }
        .m3d-pin {
          width: 28px; height: 28px; border-radius: 50%; padding: 0; cursor: pointer;
          background: #000080; color: #fff; font-weight: bold; font-size: 13px;
          border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.5);
          transition: transform 150ms ease-out;
        }
        .m3d-pin:not([data-visible]) { opacity: 0.35; }
        .m3d-pin.on { background: #d00; transform: scale(1.2); }
        @media (prefers-reduced-motion: reduce) { .m3d-pin { transition: none; } }
      `}</style>
    </div>
  );
}

// Model we wpisie: 3D + lista pinezek (tekst i głos autora przy każdej)
export default function ModelView({ model }) {
  const [active, setActive] = useState(-1);
  if (!model?.url) return null;
  const pins = model.pins || [];
  return (
    <div className="m3d-view">
      <Model3D src={model.url} pins={pins} active={active} onActive={setActive} />
      {pins.length > 0 && (
        <ol className="m3d-list">
          {pins.map((pin, i) => (
            <li key={i} className={i === active ? 'on' : ''}>
              <button type="button" className="m3d-num" onClick={() => setActive(i === active ? -1 : i)}>{i + 1}</button>
              <div className="m3d-body">
                {pin.text && <p>{pin.text}</p>}
                {pin.voiceUrl && <VoicePlayer url={pin.voiceUrl} mode="wlasny" />}
              </div>
            </li>
          ))}
        </ol>
      )}
      <style jsx global>{`
        .m3d-view { margin: 10px 0 0; display: flex; flex-direction: column; gap: 8px; }
        .m3d-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
        .m3d-list li { display: flex; gap: 8px; align-items: flex-start; padding: 6px; background: #fff; border: 1px solid #c0c0c0; }
        .m3d-list li.on { border-color: #d00; background: #fff6f6; }
        .m3d-num {
          flex: none; width: 28px; height: 28px; border-radius: 50%; border: 2px solid #fff; cursor: pointer;
          background: #000080; color: #fff; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }
        .m3d-list li.on .m3d-num { background: #d00; }
        .m3d-body { flex: 1; min-width: 0; }
        .m3d-body p { margin: 4px 0 6px; font-size: 14px; white-space: pre-wrap; }
        .m3d-body .voice-player { margin: 0; }
      `}</style>
    </div>
  );
}
