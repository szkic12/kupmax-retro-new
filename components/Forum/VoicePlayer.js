'use client';
// Odsłuch wpisu: play/pauza, pasek, czas i prędkość 1x / 1.5x / 2x.
import { useEffect, useRef, useState } from 'react';

const SPEEDS = [1, 1.5, 2];
const LABEL = {
  wlasny: '🎙️ głos autora',
  zmieniony: '🎭 głos zmieniony',
  lektor: '📻 czyta lektor AI',
};
const fmt = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '–:––');

export default function VoicePlayer({ url, mode, seconds }) {
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(seconds || 0);
  const [speed, setSpeed] = useState(1);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = speed;
  }, [speed]);

  if (!url) return null;

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => setErr(true));
    else a.pause();
  };

  const seek = (e) => {
    const a = audio.current;
    const total = Number.isFinite(a?.duration) ? a.duration : dur;
    if (!a || !total) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * total;
  };

  const pct = dur ? Math.min(100, (time / dur) * 100) : 0;

  return (
    <div className="voice-player">
      <audio
        ref={audio}
        src={url}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDur(e.currentTarget.duration)}
        onError={() => setErr(true)}
      />
      <button type="button" className="vp-play" onClick={toggle} aria-label={playing ? 'Pauza' : 'Odsłuchaj'}>
        {playing ? '⏸️' : '▶️'}
      </button>
      <div className="vp-bar" onClick={seek} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="vp-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="vp-time">{fmt(time)} / {fmt(dur)}</span>
      <button
        type="button"
        className="vp-speed"
        onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
        aria-label="Prędkość odtwarzania"
      >
        {speed}x
      </button>
      <span className="vp-label">{err ? '⚠️ nie da się odtworzyć' : LABEL[mode] || ''}</span>

      <style jsx global>{`
        .voice-player {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
          background: #fff; border: 2px inset #fff; padding: 6px 8px; margin: 0 0 10px; color: #000;
        }
        .voice-player button {
          background: #c0c0c0; border: 2px solid; border-color: #fff #808080 #808080 #fff;
          cursor: pointer; font-size: 14px; padding: 4px 8px; color: #000;
        }
        .voice-player button:active { border-color: #808080 #fff #fff #808080; }
        .vp-bar { flex: 1 1 120px; height: 12px; background: #e0e0e0; border: 1px solid #808080; cursor: pointer; position: relative; }
        .vp-fill { height: 100%; background: #000080; }
        .vp-time { font-size: 12px; font-variant-numeric: tabular-nums; }
        .vp-speed { min-width: 46px; }
        .vp-label { font-size: 12px; color: #555; }
      `}</style>
    </div>
  );
}
