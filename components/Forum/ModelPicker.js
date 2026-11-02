'use client';
// Dodawanie modelu 3D do wpisu: wybór pliku, zamiana na .glb, wgranie prosto do Supabase,
// potem wbijanie pinezek. Do każdej pinezki można napisać albo powiedzieć, co to za miejsce.
import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { forumFetch } from '@/lib/forum-client';
import { MODEL_ACCEPT, MAX_MODEL_BYTES, toGlb } from '@/lib/model-convert';
import { Model3D } from '@/components/Forum/Model3D';

const MAX_PINS = 20;
const mb = (b) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

export default function ModelPicker({ model, onChange }) {
  const input = useRef(null);
  const [step, setStep] = useState(''); // komunikat w trakcie
  const [err, setErr] = useState('');
  const [active, setActive] = useState(-1);

  const pick = async (files) => {
    setErr('');
    if (!files.length) return;
    try {
      setStep('🔧 Przerabiam model na .glb…');
      const { blob, name } = await toGlb(files);
      if (blob.size > MAX_MODEL_BYTES) throw new Error(`Model ma ${mb(blob.size)}, a mieści się najwyżej 50 MB. Zmniejsz go w programie skanera (mniej trójkątów).`);
      setStep(`⬆️ Wgrywam ${mb(blob.size)}…`);
      const res = await forumFetch('/api/forum/model', { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!json.success) throw new Error(json.error || 'Nie udało się przygotować wgrywania.');
      const { error } = await supabase.storage.from('forum-3d').uploadToSignedUrl(json.key, json.token, blob, { contentType: 'model/gltf-binary' });
      if (error) throw new Error('Wgrywanie przerwane. Spróbuj jeszcze raz.');
      onChange({ key: json.key, name, size: blob.size, pins: [], preview: URL.createObjectURL(blob) });
    } catch (e) {
      setErr(e.message || 'Nie udało się otworzyć modelu.');
    } finally {
      setStep('');
    }
  };

  const setPins = (fn) => onChange((m) => ({ ...m, pins: fn(m.pins) }));
  const addPin = ({ p, n }) => {
    if (model.pins.length >= MAX_PINS) return setErr(`Najwyżej ${MAX_PINS} pinezek.`);
    setPins((pins) => [...pins, { p, n, text: '', voice: null }]);
    setActive(model.pins.length);
  };
  const editPin = (i, patch) => setPins((pins) => pins.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const removePin = (i) => { setPins((pins) => pins.filter((_, j) => j !== i)); setActive(-1); };

  if (!model) {
    return (
      <div className="model-picker">
        <button type="button" className="mp-add" onClick={() => input.current?.click()} disabled={!!step}>
          {step || '🧊 Dodaj model 3D (skan)'}
        </button>
        <input ref={input} type="file" accept={MODEL_ACCEPT} multiple hidden onChange={(e) => { pick([...(e.target.files || [])]); e.target.value = ''; }} />
        <p className="mp-info">Plik .glb z apki na telefon (Scaniverse, KIRI, Polycam) albo .stl / .ply / .obj ze skanera. Przy .obj zaznacz razem plik .mtl i tekstury. Do 50 MB.</p>
        {err && <p className="mp-err">⚠️ {err}</p>}
        <Styles />
      </div>
    );
  }

  return (
    <div className="model-picker">
      <Model3D src={model.preview || model.url} pins={model.pins} editable onPick={addPin} active={active} onActive={setActive} />
      <div className="mp-head">
        <span>🧊 {model.name} · {mb(model.size)} · 📍 {model.pins.length}/{MAX_PINS}</span>
        <button type="button" onClick={() => { onChange(null); setActive(-1); }}>🗑️ usuń model</button>
      </div>
      {model.pins.length === 0 && <p className="mp-info">Stuknij w miejsce na modelu, np. ostrze albo zawias, i opisz je głosem albo tekstem.</p>}
      <ol className="mp-pins">
        {model.pins.map((pin, i) => (
          <li key={i} className={i === active ? 'on' : ''} onFocus={() => setActive(i)}>
            <button type="button" className="m3d-num" onClick={() => setActive(i === active ? -1 : i)}>{i + 1}</button>
            <textarea
              rows={2}
              maxLength={400}
              placeholder="Co tu jest? Do czego służy? Na co uważać?"
              value={pin.text}
              onChange={(e) => editPin(i, { text: e.target.value })}
            />
            <PinMic
              has={!!pin.voice}
              onDone={(key, text) => editPin(i, { voice: key, ...(pin.text ? {} : { text }) })}
              onClear={() => editPin(i, { voice: null })}
            />
            <button type="button" className="mp-x" onClick={() => removePin(i)} aria-label="Usuń pinezkę">✕</button>
          </li>
        ))}
      </ol>
      {err && <p className="mp-err">⚠️ {err}</p>}
      <Styles />
    </div>
  );
}

// Krótkie nagranie do pinezki: trzymaj i mów (twój głos, tekst wpisze się sam)
function PinMic({ has, onDone, onClear }) {
  const [state, setState] = useState('idle');
  const rec = useRef(null);

  const start = async (e) => {
    e.preventDefault();
    if (state !== 'idle') return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported(t)) || '';
      const mr = new MediaRecorder(stream, { ...(type ? { mimeType: type } : {}), audioBitsPerSecond: 32000 });
      const chunks = [];
      const t0 = Date.now();
      mr.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const secs = Math.round((Date.now() - t0) / 1000);
        if (secs < 1) return setState('idle');
        setState('busy');
        const form = new FormData();
        form.append('audio', new Blob(chunks, { type: mr.mimeType || 'audio/webm' }), 'pinezka');
        form.append('mode', 'wlasny');
        form.append('seconds', String(secs));
        const json = await (await forumFetch('/api/forum/voice', { method: 'POST', body: form })).json().catch(() => ({}));
        setState('idle');
        if (json.success && json.key) onDone(json.key, json.text || '');
      };
      rec.current = mr;
      mr.start();
      setState('rec');
      setTimeout(() => mr.state === 'recording' && mr.stop(), 120000);
    } catch {
      setState('idle');
    }
  };
  const stop = () => { if (rec.current?.state === 'recording') rec.current.stop(); };

  if (has && state === 'idle') return <button type="button" className="mp-mic has" onClick={onClear} title="Usuń nagranie">🔊✕</button>;
  return (
    <button
      type="button"
      className={`mp-mic ${state === 'rec' ? 'live' : ''}`}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      title="Trzymaj i mów"
      disabled={state === 'busy'}
    >
      {state === 'busy' ? '⏳' : '🎤'}
    </button>
  );
}

function Styles() {
  return (
    <style jsx global>{`
      .model-picker { display: flex; flex-direction: column; gap: 8px; }
      .mp-add, .mp-head button, .mp-mic, .mp-x {
        background: #c0c0c0; border: 2px solid; border-color: #fff #808080 #808080 #fff; cursor: pointer; color: #000; font-size: 14px;
      }
      .mp-add { padding: 10px 14px; align-self: flex-start; font-size: 15px; }
      .mp-add:disabled { cursor: progress; }
      .mp-info { margin: 0; font-size: 12px; color: #333; line-height: 1.4; }
      .mp-err { margin: 0; font-size: 13px; color: #c00; }
      .mp-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13px; }
      .mp-head button { padding: 4px 10px; }
      .mp-pins { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
      .mp-pins li { display: flex; gap: 6px; align-items: flex-start; padding: 6px; background: #fff; border: 1px solid #c0c0c0; }
      .mp-pins li.on { border-color: #d00; }
      .mp-pins textarea { flex: 1; min-width: 0; font-size: 14px; padding: 4px; border: 2px inset #fff; resize: vertical; }
      .mp-mic { width: 40px; height: 40px; flex: none; touch-action: none; user-select: none; -webkit-user-select: none; }
      .mp-mic.live { background: #ff6b6b; }
      .mp-mic.has { font-size: 12px; }
      .mp-x { width: 32px; height: 32px; flex: none; }
      .m3d-num {
        flex: none; width: 28px; height: 28px; border-radius: 50%; border: 2px solid #fff; cursor: pointer;
        background: #000080; color: #fff; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.4);
      }
      .mp-pins li.on .m3d-num { background: #d00; }
    `}</style>
  );
}
