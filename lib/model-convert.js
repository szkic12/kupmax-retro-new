'use client';
// Pliki ze skanera albo apki na telefon zamieniamy w przeglądarce na jeden plik .glb.
// GLB idzie bez zmian. STL, PLY i OBJ (z MTL i teksturami, jeśli zaznaczysz je razem) przerabia three.js.

const ext = (f) => f.name.toLowerCase().split('.').pop();

export const MODEL_ACCEPT = '.glb,.stl,.ply,.obj,.mtl,.jpg,.jpeg,.png,.webp';
export const MAX_MODEL_BYTES = 50 * 1024 * 1024;

export async function toGlb(fileList) {
  const files = [...fileList];
  const main = files.find((f) => ['glb', 'stl', 'ply', 'obj'].includes(ext(f)));
  if (!main) throw new Error('Wybierz plik modelu: .glb, .stl, .ply albo .obj.');
  const name = main.name.replace(/\.[^.]+$/, '') + '.glb';
  if (ext(main) === 'glb') return { blob: new Blob([main], { type: 'model/gltf-binary' }), name };

  const THREE = await import('three');
  const object = await load(THREE, main, files);
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
  const glb = await new GLTFExporter().parseAsync(object, { binary: true });
  return { blob: new Blob([glb], { type: 'model/gltf-binary' }), name };
}

async function load(THREE, main, files) {
  const buf = await main.arrayBuffer();
  const kind = ext(main);

  if (kind === 'stl' || kind === 'ply') {
    const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js');
    const { PLYLoader } = await import('three/examples/jsm/loaders/PLYLoader.js');
    const geo = kind === 'stl' ? new STLLoader().parse(buf) : new PLYLoader().parse(buf);
    if (!geo.hasAttribute('normal')) geo.computeVertexNormals();
    const colors = geo.hasAttribute('color');
    const mat = new THREE.MeshStandardMaterial({ color: colors ? 0xffffff : 0xb8b8b8, vertexColors: colors, roughness: 0.7 });
    if (kind === 'stl') geo.rotateX(-Math.PI / 2); // skanery i drukarki trzymają „górę” na osi Z
    return new THREE.Mesh(geo, mat);
  }

  // OBJ: tekstury i MTL bierzemy z plików zaznaczonych razem z modelem
  const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
  const { MTLLoader } = await import('three/examples/jsm/loaders/MTLLoader.js');
  const urls = new Map(files.map((f) => [f.name.toLowerCase(), URL.createObjectURL(f)]));
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((u) => urls.get(decodeURIComponent(u).split(/[\\/]/).pop().toLowerCase()) || u);
  try {
    const loader = new OBJLoader(manager);
    const mtl = files.find((f) => ext(f) === 'mtl');
    if (mtl) {
      const text = await mtl.text();
      const materials = new MTLLoader(manager).parse(text, '');
      if (/^\s*map_/im.test(text)) {
        const done = new Promise((r) => { manager.onLoad = r; setTimeout(r, 8000); });
        materials.preload();
        await done;
      } else {
        materials.preload();
      }
      loader.setMaterials(materials);
    }
    const obj = loader.parse(new TextDecoder().decode(buf));
    await new Promise((r) => setTimeout(r, 300));
    return obj;
  } finally {
    setTimeout(() => urls.forEach((u) => URL.revokeObjectURL(u)), 10000);
  }
}
