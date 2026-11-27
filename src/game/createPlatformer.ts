import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { TimeOfDay } from '../garden/landmarks';
import { AREA_NAMES, blossoms, checkpoints, coursePoint, FORWARD, goal, LEVEL_ASSET, platforms, PLAYER_FEET, STEP, surface } from './level';
import { GardenSimulation, initializePhysics, type GameSnapshot } from './simulation';
import { createGameInput } from './input';

export type PlatformerApi = {
  start(): void; pause(): void; resume(): void; restart(): void;
  setStick(x: number, y: number): void; jump(): void; dispose(): void;
};
type Options = {
  host: HTMLDivElement; controls: HTMLElement; time: TimeOfDay; signal: AbortSignal;
  onChange(snapshot: GameSnapshot): void; onError(): void;
};

function disposeObjects(...roots: THREE.Object3D[]) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  roots.forEach(root => root.traverse(object => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
      geometries.add(object.geometry);
      (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
    }
  }));
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
}

export async function createPlatformer(options: Options): Promise<PlatformerApi> {
  const { host, controls, time, signal, onChange, onError } = options;
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const response = await fetch(`${import.meta.env.BASE_URL}${LEVEL_ASSET.slice(1)}`, { signal });
  if (!response.ok) throw new Error('The garden could not load.');
  const bytes = await response.arrayBuffer();
  await initializePhysics();
  signal.throwIfAborted();
  const { scene: assets } = await loader.parseAsync(bytes, `${import.meta.env.BASE_URL}models/`);
  if (signal.aborted) { disposeObjects(assets); signal.throwIfAborted(); }
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
  catch (error) { disposeObjects(assets); throw error; }
  const simulation = new GardenSimulation();
  const scene = new THREE.Scene();
  const dusk = time === 'dusk';
  const background = dusk ? '#e1d8e0' : '#f3f2e6';
  scene.background = new THREE.Color(background);
  scene.fog = new THREE.Fog(background, 32, 67);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = dusk ? 1.02 : 1.04;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);
  const camera = new THREE.OrthographicCamera(-10, 10, 8, -8, .1, 140);
  const cameraTarget = new THREE.Vector3();
  let cameraReady = false;
  scene.add(new THREE.HemisphereLight(dusk ? '#eee2f4' : '#fff7dd', '#c1c6ac', dusk ? 2.2 : 2.8));
  const fill = new THREE.DirectionalLight('#dce8e5', 1.2);
  fill.position.set(8, 6, 10); scene.add(fill);
  const sunlight = new THREE.DirectionalLight(dusk ? '#f4c4c8' : '#fff0d4', dusk ? 2 : 3);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  Object.assign(sunlight.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: .5, far: 45 });
  sunlight.shadow.normalBias = .04;
  sunlight.shadow.bias = -.0004;
  scene.add(sunlight, sunlight.target);

  const cube = new THREE.BoxGeometry();
  const palette = new Map<string, THREE.MeshStandardMaterial>();
  function material(color: string) {
    if (!palette.has(color)) palette.set(color, new THREE.MeshStandardMaterial({ color, roughness: .93 }));
    return palette.get(color)!;
  }
  function box(x: number, y: number, z: number, w: number, h: number, d: number, color: string) {
    const mesh = new THREE.Mesh(cube, material(color));
    mesh.position.set(x, y, z); mesh.scale.set(w, h, d);
    mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
    return mesh;
  }
  function prefab(name: string, x: number, y: number, z: number, scale = 1) {
    const source = assets.getObjectByName(name);
    if (!source) throw new Error(`Missing garden prefab: ${name}`);
    // Meshopt may encode quantization in a node's transform. Keep that authored
    // transform intact, and place/animate an outer instance instead.
    const object = new THREE.Group();
    object.add(source.clone(true));
    object.position.set(x, y, z); object.scale.setScalar(scale);
    object.traverse(child => { if (child instanceof THREE.Mesh) { child.castShadow = true; child.receiveShadow = true; } });
    scene.add(object); return object;
  }

  for (const [i, p] of platforms.entries()) {
    const { x, z } = p.position, top = surface(p), [w, h, d] = p.size;
    if (p.kind === 'wood') {
      box(x, top - (h + .09) / 2, z, w, h - .09, d, '#a78360');
      const planks = Math.ceil(w / .42);
      for (let k = 0; k < planks; k++) box(x - w / 2 + (k + .5) * w / planks, top - .045, z, w / planks - .03, .09, d, k % 2 ? '#ccaf86' : '#ddc29a');
      for (const side of [-1, 1]) {
        box(x + side * (w / 2 - .15), top - .62, z, .2, 1.4, .2, '#9a7959');
        box(x, top - .36, z + side * (d / 2 - .24), w + .18, .2, .22, '#977653');
      }
    } else {
      box(x, top - (h + .19) / 2, z, w, h - .19, d, p.kind === 'stone' ? '#b6b5a0' : '#ac9172');
      box(x, top - .095, z, w + .04, .19, d + .04, p.kind === 'stone' ? '#d1d0b8' : '#9fb581');
      box(x, top - h + .08, z, w * .76, .34, d * .76, p.kind === 'stone' ? '#9eaa93' : '#957b5e');
      for (let k = 0; k < 3; k++) box(x - w * .38 + k * w * .28, top - .16, z + d / 2 + .025, .4, .26 + k % 2 * .15, .1, '#849e6c');
    }
    // Two inlays point toward the next landing. Keep them below the pickups
    // and bright enough to read on both grass and stone.
    if (i < platforms.length - 1) {
      const next = platforms[i + 1].position;
      const direction = new THREE.Vector3(next.x - x, 0, next.z - z).normalize();
      for (let k = 0; k < 2; k++) {
        const offset = .53 + k * .39;
        const size = k === 0 ? .24 : .17;
        box(x + direction.x * offset, top + .012, z + direction.z * offset, size, .023, size, '#f5dfae').rotation.y = Math.atan2(direction.x, direction.z) + Math.PI / 4;
      }
    }
    if (w > 5) {
      prefab('cherry', x - w * (i === 0 ? .43 : .37), top, z + d * (i === 0 ? .17 : -.22), i === 18 ? 1.65 : 1.25);
      prefab('shrub', x + w * .34, top, z + d * .32, 1.2);
      prefab('shrub', x - w * .38, top, z + d * .32, .95);
      prefab('mushroom', x + w * .35, top, z - d * .34, .85);
    } else if (i % 3 === 0 && p.kind !== 'wood') {
      prefab('mushroom', x + w * .34, top, z - d * .32, .65);
    }
  }

  // The pond is a quiet backdrop below the hopping stones, never a walkable floor.
  const pondCenter = coursePoint(3, 12, -1.75);
  const water = new THREE.Mesh(new THREE.CircleGeometry(21, 64), new THREE.MeshStandardMaterial({ color: dusk ? '#99bbb5' : '#acd1bf', roughness: .8, transparent: true, opacity: .64 }));
  water.rotation.x = -Math.PI / 2; water.position.copy(pondCenter); water.scale.y = .75; water.receiveShadow = true; scene.add(water);
  for (let i = 0; i < 12; i++) {
    const point = coursePoint(Math.sin(i * 8.3) * 13 + 3, 3 + i * 1.8, -1.72);
    const pad = new THREE.Mesh(new THREE.CircleGeometry(.55 + i % 3 * .18, 7), material(i % 2 ? '#98b889' : '#adc69a'));
    pad.rotation.x = -Math.PI / 2; pad.position.copy(point); scene.add(pad);
  }

  const checkpointReady = material('#f5dfae');
  const checkpointReached = material('#849e6c');
  const checkpointMarkers = checkpoints.map(({ position: { x, y, z } }) => {
    const tile = box(x, y + .015, z, 1.3, .03, 1.3, '#f5dfae');
    const stamp = box(x, y + .037, z, .59, .014, .59, '#e9d9af');
    stamp.rotation.y = Math.PI / 4;
    prefab('lantern', x + 1.65, y, z, .85);
    return tile;
  });
  const home = prefab('treehouse', goal.x + FORWARD.x * 1.3, goal.y, goal.z + FORWARD.z * 1.3, 1);
  home.rotation.y = Math.atan2(.530, .848);
  const collectibles = blossoms.map(blossom => prefab('blossom', blossom.position.x, blossom.position.y, blossom.position.z, 1));
  const player = prefab('sprout', 0, 0, 0, 1);
  const petalPositions = new Float32Array(32 * 3);
  const petalGeometry = new THREE.BufferGeometry();
  petalGeometry.setAttribute('position', new THREE.BufferAttribute(petalPositions, 3));
  const petals = new THREE.Points(petalGeometry, new THREE.PointsMaterial({ color: '#e7afc1', size: .065, transparent: true, opacity: .7 }));
  scene.add(petals);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motion.matches;
  let disposed = false, failed = false, frame = 0, lastTime = 0, accumulator = 0, elapsed = 0;
  let lastSnapshot = '', lastFall = 0;
  let inputPhase: GameSnapshot['phase'] | undefined;
  let facing = Math.atan2(.530, .848);

  function publish() {
    const snapshot = simulation.snapshot;
    const signature = JSON.stringify(snapshot);
    if (lastSnapshot !== signature) {
      lastSnapshot = signature;
      if (inputPhase !== snapshot.phase) { input.setEnabled(snapshot.phase === 'playing'); inputPhase = snapshot.phase; }
      onChange(snapshot);
    }
  }
  function invalidate() { if (!disposed && !failed && !document.hidden && !frame) frame = requestAnimationFrame(render); }
  function pause() { simulation.pause(); input.clear(); accumulator = 0; publish(); invalidate(); }
  const input = createGameInput(controls, pause);
  function resize() {
    const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight), aspect = width / height;
    const vertical = Math.max(15, 12 / aspect);
    camera.left = -vertical * aspect / 2; camera.right = vertical * aspect / 2;
    camera.top = vertical / 2; camera.bottom = -vertical / 2;
    camera.updateProjectionMatrix(); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); renderer.setSize(width, height);
    invalidate();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  function changeMotion(event: MediaQueryListEvent) { reducedMotion = event.matches; invalidate(); }
  motion.addEventListener('change', changeMotion);
  function contextLost(event: Event) { event.preventDefault(); fail(); }
  function fail() { if (disposed || failed) return; failed = true; pause(); cancelAnimationFrame(frame); frame = 0; onError(); }
  renderer.domElement.addEventListener('webglcontextlost', contextLost);

  function render(now: number) {
    frame = 0;
    if (disposed || failed) return;
    try {
      const dt = lastTime ? Math.min((now - lastTime) / 1000, .08) : STEP;
      lastTime = now;
      if (simulation.phase === 'playing') {
        accumulator += dt;
        while (accumulator >= STEP) { simulation.step(input.read()); accumulator -= STEP; }
        elapsed += dt;
      }
      const position = simulation.position;
      const feetY = position.y - PLAYER_FEET;
      const moving = Math.hypot(simulation.velocity.x, simulation.velocity.z) > .15 && simulation.phase === 'playing';
      if (moving) facing = Math.atan2(simulation.velocity.x, simulation.velocity.z);
      player.position.set(position.x, feetY + (!reducedMotion && moving && simulation.grounded ? Math.abs(Math.sin(elapsed * 15)) * .045 : 0), position.z);
      player.rotation.y = facing;
      const desired = new THREE.Vector3(position.x + FORWARD.x * 2.3, Math.max(feetY, -1) + .55, position.z + FORWARD.z * 2.3);
      if (!cameraReady || reducedMotion || simulation.falls !== lastFall) { cameraTarget.copy(desired); cameraReady = true; }
      else cameraTarget.lerp(desired, 1 - Math.exp(-7 * dt));
      lastFall = simulation.falls;
      camera.position.copy(cameraTarget).add(new THREE.Vector3(10, 13, 16)); camera.lookAt(cameraTarget);
      sunlight.position.copy(cameraTarget).add(new THREE.Vector3(-7, 16, 9)); sunlight.target.position.copy(cameraTarget);
      collectibles.forEach((object, i) => {
        object.visible = !simulation.collected.has(blossoms[i].id);
        object.position.y = blossoms[i].position.y + (reducedMotion ? 0 : Math.sin(elapsed * 2 + i) * .1);
        object.rotation.y = reducedMotion ? 0 : elapsed * .5 + i;
        object.rotation.x = .28;
      });
      checkpointMarkers.forEach((tile, i) => {
        tile.material = simulation.checkpoint > i ? checkpointReached : checkpointReady;
      });
      petals.visible = !reducedMotion;
      if (!reducedMotion) {
        for (let i = 0; i < 32; i++) {
          petalPositions[i * 3] = position.x + Math.sin(i * 13.1) * 10 + Math.sin(elapsed * .4 + i) * .35;
          petalPositions[i * 3 + 1] = Math.max(0, feetY) + ((i * .67 - elapsed * .22) % 8 + 8) % 8;
          petalPositions[i * 3 + 2] = position.z + Math.cos(i * 7.4) * 10;
        }
        petalGeometry.attributes.position.needsUpdate = true;
      }
      publish();
      renderer.render(scene, camera);
      if (simulation.phase === 'playing') invalidate();
    } catch (error) { console.error('Hidden Garden rendering failed', error); fail(); }
  }

  function run(action: () => void) { action(); accumulator = 0; lastTime = 0; publish(); invalidate(); }
  const api: PlatformerApi = {
    start: () => run(() => simulation.start()), pause,
    resume: () => run(() => simulation.resume()),
    restart: () => { cameraReady = false; run(() => simulation.restart()); },
    setStick: input.setStick, jump: input.jump,
    dispose() {
      if (disposed) return; disposed = true;
      cancelAnimationFrame(frame); observer.disconnect(); input.dispose();
      motion.removeEventListener('change', changeMotion);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      signal.removeEventListener('abort', api.dispose);
      simulation.dispose(); disposeObjects(scene, assets); sunlight.shadow.dispose(); renderer.dispose(); renderer.domElement.remove();
      if (import.meta.env.DEV) {
        delete diagnostics.__gardenGame;
        delete diagnostics.render_game_to_text;
      }
    },
  };
  signal.addEventListener('abort', api.dispose, { once: true });
  const diagnostics = window as Window & { __gardenGame?: unknown; render_game_to_text?: () => string };
  // Read-only diagnostics make real keyboard/touch playtests observable.
  if (import.meta.env.DEV) {
    const inspect = () => ({
      ...simulation.snapshot, position: simulation.position, velocity: { ...simulation.velocity },
      grounded: simulation.grounded, area: AREA_NAMES[simulation.checkpoint],
    });
    diagnostics.__gardenGame = { inspect, platforms, blossoms };
    diagnostics.render_game_to_text = () => JSON.stringify({ axes: 'Y up; X/Z ground plane', ...inspect() });
  }
  resize(); publish(); invalidate();
  return api;
}
