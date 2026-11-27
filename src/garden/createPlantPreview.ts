import * as THREE from 'three';
import { createPlantMesh } from './createPlantMesh';
import type { PlantColors, PlantKind } from './plantings';
import type { FlowerDesign } from './flowerDesign';

export function createPlantPreview(host: HTMLElement, onError: () => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.domElement.setAttribute('aria-hidden', 'true'); host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2, 2, 2, -2, .1, 30);
  camera.position.set(3, 2.7, 4.5); camera.lookAt(0, .6, 0);
  scene.add(new THREE.HemisphereLight('#fff6e6', '#b8c6a4', 3));
  const sun = new THREE.DirectionalLight('#fff3de', 2.7);
  sun.position.set(-3, 6, 4); sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512); sun.shadow.normalBias = .025;
  Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 3, bottom: -2, near: .1, far: 15 });
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#e8efe7', .8); fill.position.set(3, 3, -4); scene.add(fill);
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial({ roughness: .95 });
  const turntable = new THREE.Group(); scene.add(turntable);
  const soil = new THREE.InstancedMesh(geometry, material, 8);
  const block = new THREE.Object3D();
  [
    [0, -.10, 0, 1.46, .22, 1.32, '#c7b294'], [0, .025, 0, 1.5, .06, 1.36, '#adbd90'],
    [-.55, .07, -.40, .22, .08, .22, '#9bae7f'], [.57, .075, .33, .20, .09, .18, '#9eaf80'],
    [-.54, .072, .40, .18, .06, .13, '#ece0c2'], [-.34, .08, .48, .10, .07, .11, '#dad3b7'],
    [.52, .07, -.40, .11, .05, .14, '#e5b6c5'], [.41, .07, -.52, .10, .05, .10, '#efd1d8'],
  ].forEach(([x, y, z, w, h, d, color], i) => {
    block.position.set(Number(x), Number(y), Number(z)); block.scale.set(Number(w), Number(h), Number(d)); block.updateMatrix();
    soil.setMatrixAt(i, block.matrix); soil.setColorAt(i, new THREE.Color(String(color)));
  });
  soil.castShadow = true; soil.receiveShadow = true; turntable.add(soil);
  let plant: THREE.InstancedMesh | undefined;
  let frame = 0, disposed = false, failed = false, last = 0;
  let angle = -.15, targetAngle = -.15, size = 1;
  let pointer: { id: number; x: number } | null = null;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  function invalidate() { if (!frame && !disposed && !failed && !document.hidden) frame = requestAnimationFrame(render); }
  function render(now: number) {
    frame = 0;
    if (disposed || failed || document.hidden) return;
    const dt = last ? Math.min(.05, (now - last) / 1000) : .016; last = now;
    angle = motion.matches ? targetAngle : THREE.MathUtils.damp(angle, targetAngle, 16, dt);
    size = motion.matches ? 1 : THREE.MathUtils.damp(size, 1, 12, dt);
    turntable.rotation.y = angle;
    if (plant) plant.scale.setScalar(size);
    try { renderer.render(scene, camera); } catch { fail(); }
    if (Math.abs(angle - targetAngle) > .001 || size < .999) invalidate();
  }
  function resize() {
    const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
    const aspect = width / height, vertical = Math.max(2.15, 2.9 / aspect);
    camera.left = -vertical * aspect / 2; camera.right = vertical * aspect / 2; camera.top = vertical / 2; camera.bottom = -vertical / 2;
    camera.updateProjectionMatrix(); renderer.setSize(width, height); invalidate();
  }
  function fail() { if (failed || disposed) return; failed = true; cancelAnimationFrame(frame); frame = 0; onError(); }
  function contextLost(event: Event) { event.preventDefault(); fail(); }
  function down(event: PointerEvent) { if (event.button !== 0) return; pointer = { id: event.pointerId, x: event.clientX }; host.setPointerCapture(event.pointerId); }
  function move(event: PointerEvent) {
    if (pointer?.id !== event.pointerId) return;
    targetAngle += (event.clientX - pointer.x) * .012; pointer.x = event.clientX; invalidate();
  }
  function up(event: PointerEvent) { if (pointer?.id === event.pointerId) { pointer = null; if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId); } }
  const events = new AbortController();
  host.addEventListener('pointerdown', down, { signal: events.signal }); host.addEventListener('pointermove', move, { signal: events.signal });
  host.addEventListener('pointerup', up, { signal: events.signal }); host.addEventListener('pointercancel', up, { signal: events.signal });
  host.addEventListener('lostpointercapture', up, { signal: events.signal });
  renderer.domElement.addEventListener('webglcontextlost', contextLost, { signal: events.signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else { last = 0; invalidate(); } }, { signal: events.signal });
  motion.addEventListener('change', invalidate, { signal: events.signal });
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  return {
    setPlant(kind: PlantKind, colors: PlantColors, design?: FlowerDesign) {
      const changedKind = plant?.name !== kind;
      if (plant) { turntable.remove(plant); plant.dispose(); }
      plant = createPlantMesh(kind, colors, geometry, material, false, design); plant.name = kind; plant.position.y = .055;
      turntable.add(plant); size = motion.matches || !changedKind ? 1 : .72; invalidate();
    },
    turn(direction: number) { targetAngle += direction * Math.PI / 4; invalidate(); },
    dispose() {
      if (disposed) return; disposed = true; cancelAnimationFrame(frame); events.abort(); observer.disconnect();
      plant?.dispose(); soil.dispose(); geometry.dispose(); material.dispose(); sun.shadow.dispose();
      renderer.dispose();
      if (!renderer.getContext().isContextLost()) renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
