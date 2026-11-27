import * as THREE from 'three';
import { createPlantMesh } from './createPlantMesh';
import type { GardenPlant } from './plantings';
import type { TimeOfDay } from './landmarks';

export function createCommunityGarden(host: HTMLElement, onSelect: (id: string) => void, onError: () => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.domElement.setAttribute('aria-hidden', 'true'); host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-10, 10, 7, -7, .1, 70);
  camera.position.set(11, 12, 16); camera.lookAt(0, 0, 0);
  const sky = new THREE.HemisphereLight('#fff8e7', '#c2ccaa', 3.0); scene.add(sky);
  const sun = new THREE.DirectionalLight('#fff0d2', 3.2); sun.position.set(-5, 12, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.normalBias = .035;
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: .1, far: 35 }); scene.add(sun);
  const fill = new THREE.DirectionalLight('#d8e5e3', .7); fill.position.set(8, 7, -6); scene.add(fill);
  const geometry = new THREE.BoxGeometry(), material = new THREE.MeshStandardMaterial({ roughness: 1 });
  const island = new THREE.Group(); scene.add(island);
  const blocks: { position: number[]; scale: number[]; color: string }[] = [];
  function box(x: number, y: number, z: number, w: number, h: number, d: number, color: string) { blocks.push({ position: [x, y, z], scale: [w, h, d], color }); }
  // A layered, softly stepped island. The centre path keeps each patch readable.
  box(0, -.49, 0, 11.9, .64, 7.8, '#c7ac89'); box(0, -.37, 0, 12.8, .52, 6.5, '#d5bf99');
  box(0, -.06, 0, 12.1, .20, 8.1, '#a6b98a'); box(0, -.055, 0, 13.0, .18, 6.6, '#abbc8e');
  box(0, -.04, 0, 10.7, .18, 8.8, '#b2c297');
  for (let i = 0; i < 9; i++) {
    const z = -3.4 + i * .85, x = Math.sin(i * .8) * .26;
    box(x, .09, z, .66, .12, .53, i % 2 ? '#dfd7bb' : '#e8dfc3');
    if (i < 8) box(-5.75 + (i % 2) * .18, .09, z, .26, .16, .29, '#9caf80');
  }
  // A pond tucked behind the plant beds, with a duck and a lily pad.
  box(4.3, .08, -3.16, 2.10, .08, 1.00, '#91b9b4'); box(4.3, .08, -3.16, 1.68, .08, 1.48, '#91b9b4');
  box(4.75, .14, -3.27, .35, .045, .28, '#9db889'); box(4.75, .21, -3.27, .15, .11, .13, '#dfacbb');
  box(3.96, .22, -3.07, .29, .18, .21, '#f8edd2'); box(4.06, .35, -3.07, .14, .17, .15, '#f8edd2'); box(4.16, .33, -3.07, .09, .05, .09, '#d8af6a');
  // The rear fence and bench give the little garden a place-like scale.
  for (let i = 0; i < 8; i++) box(-4.6 + i * .62, .34, -3.9, .12, .75, .12, '#b59b76');
  box(-2.43, .54, -3.9, 4.6, .105, .10, '#c9ae85'); box(-2.43, .26, -3.9, 4.6, .10, .10, '#c9ae85');
  box(-4.65, .38, 3.25, 1.24, .14, .44, '#bf9d75'); box(-4.65, .68, 3.08, 1.24, .24, .09, '#c9ab82');
  for (const x of [-5.1, -4.22]) box(x, .18, 3.25, .10, .34, .32, '#a18462');
  for (let i = 0; i < 30; i++) {
    const x = Math.sin(i * 2.4) * 5.6, z = (i % 2 ? -1 : 1) * (3.65 + (i % 3) * .11);
    box(x, .09, z, .13, .15 + (i % 3) * .04, .12, i % 2 ? '#8ca377' : '#99af80');
    if (i % 4 === 0) box(x, .22, z, .11, .07, .11, '#e5c5ce');
  }
  const scenery = new THREE.InstancedMesh(geometry, material, blocks.length), dummy = new THREE.Object3D();
  blocks.forEach((block, i) => { dummy.position.fromArray(block.position); dummy.scale.fromArray(block.scale); dummy.updateMatrix(); scenery.setMatrixAt(i, dummy.matrix); scenery.setColorAt(i, new THREE.Color(block.color)); });
  scenery.castShadow = true; scenery.receiveShadow = true; island.add(scenery);
  const highlight = new THREE.Mesh(new THREE.RingGeometry(.50, .56, 32), new THREE.MeshBasicMaterial({ color: '#fff4cf', side: THREE.DoubleSide, transparent: true, opacity: .95 }));
  highlight.rotation.x = -Math.PI / 2; highlight.visible = false; island.add(highlight);
  const plants = new Map<string, THREE.InstancedMesh>();
  let selected: string | null = null, signature = '', angle = -.03, targetAngle = -.03;
  let disposed = false, failed = false, paused = false, frame = 0, last = 0, growth = 1;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  function invalidate() { if (!frame && !disposed && !failed && !paused && !document.hidden) frame = requestAnimationFrame(render); }
  function select(id: string | null) {
    selected = id; const plant = id ? plants.get(id) : undefined;
    highlight.visible = !!plant;
    if (plant) highlight.position.set(plant.position.x, .295, plant.position.z);
    invalidate();
  }
  function fail() { if (failed || disposed) return; failed = true; cancelAnimationFrame(frame); frame = 0; onError(); }
  function render(now: number) {
    frame = 0; if (disposed || failed || paused || document.hidden) return;
    const dt = last ? Math.min(.05, (now - last) / 1000) : .016; last = now;
    angle = motion.matches ? targetAngle : THREE.MathUtils.damp(angle, targetAngle, 12, dt);
    growth = motion.matches ? 1 : THREE.MathUtils.damp(growth, 1, 11, dt);
    island.rotation.y = angle;
    for (const plant of plants.values()) { if (plant.userData.growing) plant.scale.setScalar(.95 * growth); }
    try { renderer.render(scene, camera); } catch { fail(); }
    if (Math.abs(angle - targetAngle) > .001 || growth < .999) invalidate();
  }
  function resize() {
    const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight), aspect = w / h;
    const vertical = Math.max(10.2, 16.5 / aspect);
    camera.left = -vertical * aspect / 2; camera.right = vertical * aspect / 2; camera.top = vertical / 2; camera.bottom = -vertical / 2;
    camera.updateProjectionMatrix(); renderer.setSize(w, h); invalidate();
  }
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  function hit(event: PointerEvent) {
    const rect = host.getBoundingClientRect(); pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects([...plants.values()], false)[0]?.object.userData.id as string | undefined;
  }
  let press: { x: number; y: number } | null = null;
  const events = new AbortController();
  host.addEventListener('pointerdown', e => { if (e.button === 0) press = { x: e.clientX, y: e.clientY }; }, { signal: events.signal });
  host.addEventListener('pointerup', e => { if (!press) return; const moved = Math.hypot(e.clientX - press.x, e.clientY - press.y); press = null; if (moved < 8) { const id = hit(e); if (id) onSelect(id); } }, { signal: events.signal });
  host.addEventListener('pointercancel', () => { press = null; }, { signal: events.signal });
  host.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') host.style.cursor = hit(e) ? 'pointer' : 'default'; }, { signal: events.signal });
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); fail(); }, { signal: events.signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else { last = 0; invalidate(); } }, { signal: events.signal });
  motion.addEventListener('change', invalidate, { signal: events.signal });
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  return {
    setPlants(items: GardenPlant[]) {
      const next = JSON.stringify(items.map(p => [p.id, p.kind, p.colors, p.design])); if (next === signature) return; signature = next;
      const oldIds = new Set(plants.keys());
      for (const plant of plants.values()) { island.remove(plant); plant.dispose(); } plants.clear();
      items.slice(0, 24).forEach((item, i) => {
        const mesh = createPlantMesh(item.kind, item.colors, geometry, material, true, item.design);
        const column = i % 6, row = Math.floor(i / 6);
        const x = [-4.7, -3.0, -1.35, 1.35, 3.0, 4.7][column];
        const z = -2.25 + row * 1.52;
        mesh.position.set(x, .055, z); mesh.rotation.y = -.14 + (i % 3) * .12;
        mesh.scale.setScalar(.95); mesh.userData = { id: item.id, growing: !oldIds.has(item.id) };
        island.add(mesh); plants.set(item.id, mesh);
      });
      host.dataset.plantCount = String(plants.size); growth = .3; select(selected); invalidate();
    },
    setTime(time: TimeOfDay) { sun.color.set(time === 'dusk' ? '#ffd4c2' : '#fff0d2'); sky.color.set(time === 'dusk' ? '#e7d5e8' : '#fff8e7'); renderer.toneMappingExposure = time === 'dusk' ? .98 : 1.15; invalidate(); },
    setPaused(value: boolean) { paused = value; if (value) { cancelAnimationFrame(frame); frame = 0; } else { last = 0; invalidate(); } },
    select,
    turn(direction: number) { targetAngle += direction * Math.PI / 8; invalidate(); },
    dispose() {
      if (disposed) return; disposed = true; cancelAnimationFrame(frame); events.abort(); observer.disconnect();
      for (const plant of plants.values()) plant.dispose(); plants.clear(); scenery.dispose();
      highlight.geometry.dispose(); highlight.material.dispose(); geometry.dispose(); material.dispose(); sun.shadow.dispose();
      renderer.dispose(); if (!renderer.getContext().isContextLost()) renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
