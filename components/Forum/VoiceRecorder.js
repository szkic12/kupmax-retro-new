'use client';
// Nagrywanie jak na Telegramie: trzymasz 🎤 i mówisz, puszczasz i gotowe.
// Krótkie stuknięcie włącza nagrywanie bez trzymania (do 10 minut).
// Po nagraniu mowa zamienia się w tekst, który można poprawić przed wysłaniem.
import { useEffect, useRef, useState } from 'react';
import { forumFetch } from '@/lib/forum-client';

const MAX_SECONDS = 600;

export const MODES = [
  { id: 'wlasny', icon: '🎙️', name: 'Mój głos', info: 'Słychać ciebie, tak jak mówisz. Po głosie można cię rozpoznać.' },
  { id: 'zmieniony', icon: '🎭', name: 'Zmieniony', info: 'Głos przerobiony niżej albo wyżej. Trudniej cię poznać, ale sposób mówienia zostaje.' },
  { id: 'lektor', icon: '📻', name: 'Lektor', info: 'Twoje nagranie zamieniamy na tekst i od razu kasujemy. Wpis czyta lektor AI. Działa też z wpisanym tekstem.' },
  { id: 'tekst', icon: '✍️', name: 'Sam tekst', info: 'Nagranie zamieniamy na tekst i kasujemy. Zostaje tylko to, co napisane.' },
];

// Zwraca pierwszy format, który ta przeglądarka umie nagrać
function pickType() {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

// Zmiana wysokości głosu na żywo: dwie głowice czytające z linii opóźniającej, przenikane sinusem
function pitchShift(ctx, source, ratio) {
  const node = ctx.createScriptProcessor(4096, 1, 1);
  const W = Math.round(ctx.sampleRate * 0.08);
  const N = 1 << 15;
  const buf = new Float32Array(N);
  const step = (1 - ratio) / W;
  let w = 0;
  let phase = 0;
  const tap = (d) => {
    const pos = w - d;
    const i0 = Math.floor(pos);
    const f = pos - i0;
    return buf[i0 & (N - 1)] * (1 - f) + buf[(i0 + 1) & (N - 1)] * f;
  };
  node.onaudioprocess = (e) => {
    const input = e.inputBuffer.getChannelData(0);
    const out = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < input.length; i++) {
      buf[w] = input[i];
      phase += step;
      if (phase >= 1) phase -= 1;
      if (phase < 0) phase += 1;
      const p2 = phase < 0.5 ? phase + 0.5 : phase - 0.5;
      out[i] = tap(phase * W) * Math.sin(Math.PI * phase) + tap(p2 * W) * Math.sin(Math.PI * p2);
      w = (w + 1) & (N - 1);
    }
  };
  source.connect(node);
  return node;
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function VoiceRecorder({ voice, onChange, onText }) {
  const [state, setState] = useState('idle'); // idle | rec | locked | busy | done
  const [seconds, setSeconds] = useState(0);
  const [pitch, setPitch] = useState(0.78);
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState(null);
  const [heard, setHeard] = useState(true);
  const rec = useRef(null);
  const held = useRef(false);

  const mode = voice.mode;
  const setMode = (m) => onChange({ ...voice, mode: m });
  const current = MODES.find((m) => m.id === mode);

  useEffect(() => () => stopAll(), []);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function stopAll() {
    const r = rec.current;
    if (!r) return;
    clearInterval(r.timer);
    r.stream?.getTracks().forEach((t) => t.stop());
    r.ctx?.close().catch(() => {});
  }

  async function start() {
    setErr('');
    const type = pickType();
    if (type === null || !navigator.mediaDevices?.getUserMedia) {
      setErr('Ta przeglądarka nie umie nagrywać. Spróbuj w Chrome albo na telefonie.');
      return false;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setErr('Brak dostępu do mikrofonu. Zezwól na mikrofon w przeglądarce.');
      return false;
    }

    let recStream = stream;
    let ctx = null;
    if (mode === 'zmieniony') {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const shifted = pitchShift(ctx, src, pitch);
      const dest = ctx.createMediaStreamDestination();
      shifted.connect(dest);
      const mute = ctx.createGain();
      mute.gain.value = 0;
      shifted.connect(mute).connect(ctx.destination);
      recStream = dest.stream;
    }

    const mr = new MediaRecorder(recStream, { ...(type ? { mimeType: type } : {}), audioBitsPerSecond: 32000 });
    const chunks = [];
    mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const startedAt = Date.now();
    const r = { mr, stream, ctx, chunks, startedAt };
    r.timer = setInterval(() => {
      const s = (Date.now() - startedAt) / 1000;
      setSeconds(s);
      if (s >= MAX_SECONDS) stop();
    }, 250);
    mr.onstop = () => finish(r);
    rec.current = r;
    mr.start(1000);
    setSeconds(0);
    setState('rec');
    return true;
  }

  function stop() {
    const r = rec.current;
    if (r?.mr.state === 'recording') r.mr.stop();
  }

  async function finish(r) {
    stopAll();
    rec.current = null;
    const secs = Math.min(MAX_SECONDS, Math.round((Date.now() - r.startedAt) / 1000));
    if (secs < 1) {
      setState('idle');
      setErr('Za krótko. Trzymaj 🎤 i mów.');
      return;
    }
    const blob = new Blob(r.chunks, { type: r.mr.mimeType || 'audio/webm' });
    setPreview(URL.createObjectURL(blob));
    setState('busy');
    try {
      const form = new FormData();
      form.append('audio', blob, 'nagranie');
      form.append('mode', mode);
      form.append('seconds', String(secs));
      const res = await forumFetch('/api/forum/voice', { method: 'POST', body: form });
      const json = await res.json().catch(() => ({}));
      if (!json.success) throw new Error(json.error || 'Nie udało się przerobić nagrania.');
      onChange({ ...voice, key: json.key || null, seconds: secs });
      setHeard(!!json.text);
      if (json.text) onText(json.text);
      setState('done');
    } catch (e) {
      setErr(e.message);
      setState('idle');
      setPreview(null);
    }
  }

  // Trzymanie = nagrywanie; krótkie stuknięcie (albo puszczenie w trakcie pytania o mikrofon) = nagrywanie bez trzymania
  const onDown = async (e) => {
    e.preventDefault();
    if (state === 'locked') return stop();
    if (state !== 'idle' || rec.current) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    held.current = true;
    const ok = await start();
    if (ok && !held.current) setState('locked');
  };
  const onUp = () => {
    if (!held.current) return;
    held.current = false;
    const r = rec.current;
    if (!r || r.mr.state !== 'recording') return;
    if (Date.now() - r.startedAt < 400) setState('locked');
    else stop();
  };

  const reset = () => {
    onChange({ ...voice, key: null, seconds: null });
    setPreview(null);
    setState('idle');
    setSeconds(0);
  };

  const recording = state === 'rec' || state === 'locked';
  const hasRecording = state === 'done' || state === 'busy';

  return (
    <div className="voice-rec">
      <div className="voice-modes" role="radiogroup" aria-label="Jak ma brzmieć twój wpis">
        {MODES.map((m) => (
          <button
            type="button"
            key={m.id}
            role="radio"
            aria-checked={mode === m.id}
            className={mode === m.id ? 'on' : ''}
            disabled={recording || hasRecording}
            onClick={() => setMode(m.id)}
          >
            {m.icon} {m.name}
          </button>
        ))}
      </div>
      <p className="voice-info">ℹ️ {current?.info}</p>

      {mode === 'zmieniony' && !hasRecording && (
        <div className="voice-pitch">
          Głos:
          <label><input type="radio" checked={pitch < 1} onChange={() => setPitch(0.78)} disabled={recording} /> niżej</label>
          <label><input type="radio" checked={pitch > 1} onChange={() => setPitch(1.3)} disabled={recording} /> wyżej</label>
        </div>
      )}

      {!hasRecording && (
        <div className="voice-row">
          <button
            type="button"
            className={`voice-mic ${recording ? 'live' : ''}`}
            onPointerDown={onDown}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onContextMenu={(e) => e.preventDefault()}
            aria-label={recording ? 'Zakończ nagrywanie' : 'Trzymaj i mów'}
          >
            {state === 'locked' ? '⏹️' : '🎤'}
          </button>
          <span className="voice-hint">
            {state === 'idle' && 'Trzymaj 🎤 i mów. Stuknij raz, żeby nagrywać bez trzymania.'}
            {state === 'rec' && <><b className="voice-dot">●</b> {fmt(seconds)} / 10:00 · puść, żeby skończyć</>}
            {state === 'locked' && <><b className="voice-dot">●</b> {fmt(seconds)} / 10:00 · stuknij ⏹️, żeby skończyć</>}
          </span>
        </div>
      )}

      {hasRecording && (
        <div className="voice-row">
          {preview && <audio src={preview} controls preload="metadata" />}
          {state === 'busy'
            ? <span className="voice-hint">✍️ Zamieniam mowę na tekst…</span>
            : <button type="button" className="voice-again" onClick={reset}>🗑️ nagraj od nowa</button>}
        </div>
      )}
      {state === 'done' && (
        <p className="voice-info">
          {heard ? '✅ Tekst wpisał się niżej. Popraw, co źle usłyszało, zanim wyślesz.' : '🤔 Nie rozpoznałem słów. Nagraj od nowa bliżej mikrofonu albo dopisz tekst.'}
          {(mode === 'lektor' || mode === 'tekst') && ' Nagranie zostało skasowane.'}
        </p>
      )}
      {err && <p className="voice-err">⚠️ {err}</p>}

      <style jsx global>{`
        .voice-rec { background: #fff; border: 2px inset #fff; padding: 12px; display: flex; flex-direction: column; gap: 8px; color: #000; }
        .voice-modes { display: flex; flex-wrap: wrap; gap: 6px; }
        .voice-modes button, .voice-again {
          padding: 6px 10px; background: #c0c0c0; border: 2px solid; border-color: #fff #808080 #808080 #fff;
          cursor: pointer; font-size: 14px; color: #000;
        }
        .voice-modes button.on { border-color: #808080 #fff #fff #808080; background: #e8e8e8; font-weight: bold; }
        .voice-modes button:disabled:not(.on) { opacity: 0.5; cursor: default; }
        .voice-info { margin: 0; font-size: 13px; color: #333; line-height: 1.4; }
        .voice-pitch { display: flex; gap: 12px; font-size: 14px; align-items: center; }
        .voice-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .voice-row audio { max-width: 100%; height: 36px; }
        .voice-mic {
          width: 64px; height: 64px; border-radius: 50%; font-size: 30px; cursor: pointer; flex: none;
          background: #c0c0c0; border: 3px solid; border-color: #fff #808080 #808080 #fff;
          touch-action: none; user-select: none; -webkit-user-select: none;
          transition: transform 120ms ease-out;
        }
        .voice-mic:active { transform: scale(0.95); }
        .voice-mic.live { background: #ff6b6b; border-color: #808080 #fff #fff #808080; transform: scale(1.08); }
        .voice-hint { font-size: 14px; }
        .voice-dot { color: #d00; animation: voice-blink 1s steps(2) infinite; }
        @keyframes voice-blink { 50% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .voice-dot { animation: none; } .voice-mic { transition: none; } }
        .voice-err { margin: 0; color: #c00; font-size: 14px; }
      `}</style>
    </div>
  );
}

// Co wysłać do API z formularza
export function voicePayload(voice) {
  const needsKey = voice.mode === 'wlasny' || voice.mode === 'zmieniony';
  if (needsKey && !voice.key) return { voiceMode: 'tekst' };
  return { voiceMode: voice.mode, voiceKey: voice.key || undefined, voiceSeconds: voice.seconds || undefined };
}
