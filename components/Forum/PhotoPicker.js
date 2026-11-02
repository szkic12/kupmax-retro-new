'use client';
// Do 5 zdjęć przy wpisie. Przeglądarka zmniejsza je do 1600 px i zapisuje jako webp,
// więc wgrywa się mało danych, a z pliku znikają ukryte informacje (np. miejsce zrobienia zdjęcia).
import { useRef, useState } from 'react';
import { forumFetch } from '@/lib/forum-client';

export const MAX_PHOTOS = 5;
const MAX_SIDE = 1600;

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch { /* niżej próba przez <img> */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const toBlob = (canvas, type, q) => new Promise((res) => canvas.toBlob(res, type, q));

async function shrink(file) {
  const img = await decode(file);
  const w = img.width, h = img.height;
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  img.close?.();
  let blob = await toBlob(canvas, 'image/webp', 0.82);
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', 0.85); // stare Safari
  if (!blob) throw new Error('nie da się zapisać');
  return blob;
}

export default function PhotoPicker({ photos, onChange }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState('');
  const left = MAX_PHOTOS - photos.length - busy;

  const add = async (files) => {
    setErr('');
    const list = [...files].slice(0, Math.max(0, left));
    if (files.length > list.length) setErr(`Najwyżej ${MAX_PHOTOS} zdjęć przy jednym wpisie.`);
    setBusy((b) => b + list.length);
    for (const file of list) {
      try {
        const blob = await shrink(file);
        const form = new FormData();
        form.append('photo', blob, 'zdjecie');
        const res = await forumFetch('/api/forum/photo', { method: 'POST', body: form });
        const json = await res.json().catch(() => ({}));
        if (!json.success) throw new Error(json.error || 'Nie udało się wgrać zdjęcia.');
        const preview = URL.createObjectURL(blob);
        onChange((p) => [...p, { key: json.key, preview }]);
      } catch (e) {
        setErr(e.message === 'nie da się zapisać' || e.name === 'EncodingError' || e.name === 'InvalidStateError'
          ? `Nie umiem otworzyć „${file.name}”. Zapisz je jako JPG albo zrób zrzut ekranu.`
          : e.message);
      } finally {
        setBusy((b) => b - 1);
      }
    }
  };

  const remove = (key) => onChange((p) => p.filter((x) => x.key !== key));

  return (
    <div className="photo-picker">
      <div className="pp-grid">
        {photos.map((p) => (
          <div className="pp-thumb" key={p.key}>
            <img src={p.preview} alt="" />
            <button type="button" onClick={() => remove(p.key)} aria-label="Usuń zdjęcie">✕</button>
          </div>
        ))}
        {Array.from({ length: busy }).map((_, i) => <div className="pp-thumb pp-busy" key={`b${i}`}>⏳</div>)}
        {left > 0 && (
          <button type="button" className="pp-add" onClick={() => input.current?.click()}>
            📷<span>dodaj ({photos.length + busy}/{MAX_PHOTOS})</span>
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => { add(e.target.files || []); e.target.value = ''; }}
      />
      <p className="pp-info">Zdjęcia zmniejszamy i czyścimy z ukrytych danych, np. miejsca, gdzie je zrobiono.</p>
      {err && <p className="pp-err">⚠️ {err}</p>}

      <style jsx global>{`
        .photo-picker { display: flex; flex-direction: column; gap: 6px; }
        .pp-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .pp-thumb, .pp-add {
          width: 88px; height: 88px; position: relative; flex: none;
          border: 2px solid; border-color: #808080 #fff #fff #808080; background: #fff;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .pp-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .pp-thumb button {
          position: absolute; top: 2px; right: 2px; width: 24px; height: 24px; padding: 0;
          background: #c0c0c0; border: 2px solid; border-color: #fff #808080 #808080 #fff; cursor: pointer; font-size: 12px; color: #000;
        }
        .pp-add {
          flex-direction: column; gap: 2px; cursor: pointer; font-size: 26px; color: #000;
          background: #c0c0c0; border-color: #fff #808080 #808080 #fff;
        }
        .pp-add span { font-size: 11px; }
        .pp-add:active { border-color: #808080 #fff #fff #808080; }
        .pp-busy { font-size: 24px; }
        .pp-info { margin: 0; font-size: 12px; color: #333; }
        .pp-err { margin: 0; font-size: 13px; color: #c00; }
      `}</style>
    </div>
  );
}
