'use client';

import { useEffect, useRef, useState } from 'react';

type ConvertStatus = 'idle' | 'loading' | 'ready' | 'converting' | 'done' | 'error';

const CDN = 'https://cdn.jsdelivr.net/npm/three@0.134.0';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export default function Konwerter3DPage() {
  const [status, setStatus] = useState<ConvertStatus>('idle');
  const [fileName, setFileName] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [outputName, setOutputName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStatus('loading');
    loadScript(`${CDN}/build/three.min.js`)
      .then(() => loadScript(`${CDN}/examples/js/loaders/OBJLoader.js`))
      .then(() => loadScript(`${CDN}/examples/js/loaders/STLLoader.js`))
      .then(() => loadScript(`${CDN}/examples/js/exporters/GLTFExporter.js`))
      .then(() => setStatus('ready'))
      .catch((e) => {
        setErrorMsg('Nie udało się załadować bibliotek: ' + e.message);
        setStatus('error');
      });
  }, []);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setDownloadUrl('');
    setOutputName('');
    setErrorMsg('');
  };

  const convert = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    setStatus('converting');
    setProgress('Wczytuję plik...');
    setDownloadUrl('');

    try {
      const THREE = (window as any).THREE;
      if (!THREE) throw new Error('Three.js nie jest załadowany — odśwież stronę');

      const arrayBuffer = await file.arrayBuffer();
      const scene = new THREE.Scene();

      if (ext === 'obj') {
        setProgress('Konwertuję OBJ → GLB...');
        const text = new TextDecoder().decode(arrayBuffer);
        const loader = new THREE.OBJLoader();
        const obj = loader.parse(text);
        scene.add(obj);
      } else if (ext === 'stl') {
        setProgress('Konwertuję STL → GLB...');
        const loader = new THREE.STLLoader();
        const geometry = loader.parse(arrayBuffer);
        const material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.5 });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
      } else {
        throw new Error(`Format .${ext} nie jest obsługiwany. Użyj OBJ lub STL.`);
      }

      setProgress('Eksportuję do GLB...');

      const exporter = new THREE.GLTFExporter();
      await new Promise<void>((resolve, reject) => {
        exporter.parse(
          scene,
          (glb: ArrayBuffer) => {
            const blob = new Blob([glb], { type: 'model/gltf-binary' });
            const url = URL.createObjectURL(blob);
            const baseName = file.name.replace(/\.[^.]+$/, '');
            setDownloadUrl(url);
            setOutputName(`${baseName}.glb`);
            setStatus('done');
            setProgress('');
            resolve();
          },
          (err: any) => reject(new Error(String(err))),
          { binary: true }
        );
      });
    } catch (e: any) {
      setErrorMsg(e.message || 'Nieznany błąd konwersji');
      setStatus('error');
      setProgress('');
    }
  };

  const reset = () => {
    setStatus('ready');
    setFileName('');
    setDownloadUrl('');
    setOutputName('');
    setErrorMsg('');
    setProgress('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0f0f1a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 16px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <a href="/" style={{ color: '#7c3aed', textDecoration: 'none', fontSize: 14, marginBottom: 16, display: 'block' }}>
          ← Wróć do kupmax.pl
        </a>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🔄</div>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>
          Konwerter modeli 3D
        </h1>
        <p style={{ color: '#a78bfa', fontSize: 15, margin: 0 }}>
          Konwertuj OBJ i STL do formatu GLB gotowego do Vibe3D
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 16,
        padding: 32,
        width: '100%',
        maxWidth: 540,
        backdropFilter: 'blur(8px)',
      }}>
        {/* Supported formats */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {['.obj', '.stl'].map(fmt => (
            <span key={fmt} style={{
              background: 'rgba(124,58,237,0.2)',
              border: '1px solid #7c3aed',
              color: '#a78bfa',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 13,
              fontWeight: 600,
            }}>{fmt}</span>
          ))}
          <span style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#666',
            borderRadius: 20,
            padding: '4px 12px',
            fontSize: 13,
          }}>→ .glb</span>
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <div style={{ textAlign: 'center', color: '#a78bfa', padding: '24px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            Ładowanie bibliotek...
          </div>
        )}

        {/* Ready — file picker */}
        {status === 'ready' && (
          <>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(124,58,237,0.5)',
                borderRadius: 12,
                padding: '32px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: 20,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#7c3aed')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)')}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
              <div style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>
                {fileName || 'Kliknij aby wybrać plik'}
              </div>
              <div style={{ color: '#666', fontSize: 13 }}>
                Obsługiwane: .obj, .stl
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".obj,.stl"
                onChange={handleFilePick}
                style={{ display: 'none' }}
              />
            </div>

            {fileName && (
              <button
                onClick={convert}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🔄 Konwertuj do GLB
              </button>
            )}
          </>
        )}

        {/* Converting */}
        {status === 'converting' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚙️</div>
            <div style={{ color: '#a78bfa', fontWeight: 600, marginBottom: 8 }}>Konwertuję...</div>
            <div style={{ color: '#666', fontSize: 13 }}>{progress}</div>
          </div>
        )}

        {/* Done */}
        {status === 'done' && downloadUrl && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Gotowe!</div>
            <div style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>{outputName}</div>
            <a
              href={downloadUrl}
              download={outputName}
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#fff',
                borderRadius: 10,
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 16,
              }}
            >
              ⬇️ Pobierz {outputName}
            </a>
            <br />
            <button
              onClick={reset}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#a78bfa',
                borderRadius: 8,
                padding: '8px 20px',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Konwertuj kolejny plik
            </button>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>❌</div>
            <div style={{ color: '#f87171', fontWeight: 600, marginBottom: 8 }}>Błąd konwersji</div>
            <div style={{ color: '#999', fontSize: 13, marginBottom: 20 }}>{errorMsg}</div>
            <button
              onClick={reset}
              style={{
                background: 'rgba(124,58,237,0.2)',
                border: '1px solid #7c3aed',
                color: '#a78bfa',
                borderRadius: 8,
                padding: '8px 20px',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Spróbuj ponownie
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{
        marginTop: 24,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 20,
        maxWidth: 540,
        width: '100%',
      }}>
        <div style={{ color: '#a78bfa', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>💡 Wskazówka</div>
        <div style={{ color: '#888', fontSize: 13, lineHeight: 1.6 }}>
          Konwersja odbywa się <strong style={{ color: '#ccc' }}>bezpośrednio w Twojej przeglądarce</strong> — plik nie jest nigdzie wysyłany.
          Po pobraniu .glb wgraj go w Vibe3D w zakładce <strong style={{ color: '#ccc' }}>"Wgraj Gotowy .GLB"</strong>.
        </div>
        <div style={{ marginTop: 12, color: '#888', fontSize: 13 }}>
          Masz plik .blend? Blender eksportuje GLB natywnie: <strong style={{ color: '#ccc' }}>File → Export → glTF 2.0</strong> i zaznacz Binary (.glb).
        </div>
      </div>
    </main>
  );
}
