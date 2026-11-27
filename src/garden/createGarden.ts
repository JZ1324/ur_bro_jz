import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { gardenPins } from './landmarks';
import type { Theme } from '../themePreference';
import { sampleJourneyCamera } from './camera';
import { createChessInteraction } from './createChessInteraction';
import { chessIsInteractive, type ChessSnapshot, type PromotionKind, type Square } from './chess';
import { clamp, journeyFrame, sectionIds, smoothstep, type SectionId } from './journey';
import { createMorph, type VoxelManifest } from './createMorph';
import { chapterAtmospheres } from './atmosphere';
import { createPlantMesh } from './createPlantMesh';
import type { GardenPlant } from './plantings';
import { createKoiPond } from './createKoiPond';
import { isPondPoint, POND_CALL_POINT, WATER_LEVEL } from './koi';
import { createGardenWeather } from './createGardenWeather';
import type { GardenMood } from './mood';
import { paintGardenGeometry } from './palette';
import { createLandmarkInteraction } from './createLandmarkInteraction';

export type GardenApi = {
  setJourneyProgress: (progress: number) => void;
  setTheme: (theme: Theme) => void;
  setMood: (mood: GardenMood) => void;
  makeWish: () => void;
  focusChessBoard: (reveal?: boolean) => void;
  selectChessSquare: (square: Square) => void;
  focusChessSquare: (square: Square | null) => void;
  clearChessSelection: () => void;
  chooseChessPromotion: (kind: PromotionKind) => void;
  cancelChessPromotion: () => void;
  undoChess: () => void;
  resetChess: () => void;
  setPlants: (plants: GardenPlant[]) => void;
  setPaused: (paused: boolean) => void;
  callKoi: () => void;
  dispose: () => void;
};
type Callbacks = { onReady: () => void; onProgress: (percent: number) => void; onError: () => void; onChessChange: (snapshot: ChessSnapshot) => void };

export function createGarden(host: HTMLDivElement, pins: Map<SectionId, HTMLAnchorElement>, callbacks: Callbacks, chessSquares: Map<Square, HTMLButtonElement>, secretButton: HTMLButtonElement | null = null, plantPins = new Map<string, HTMLButtonElement>(), pondButton: HTMLButtonElement | null = null): GardenApi {
  let disposed = false;
  let paused = false;
  let failed = false;
  let frame = 0;
  let dirty = true;
  let loaded = false;
  let progress = 0;
  let night = 0;
  let nightTarget = 0;
  let mood: GardenMood = 'breeze';
  let rainLight = 0;
  let lastFrame = performance.now();
  let lastProgress = -1;
  let lastExit = -1;
  let chessOverhead = 0;
  let chessOverheadScrollY: number | undefined;
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionPreference.matches;
  const abort = new AbortController();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.03;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  // Pond taps never capture the pointer or prevent native scrolling and pinch.
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const island = new THREE.Group();
  scene.add(island);
  const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, .1, 120);
  const target = new THREE.Vector3();
  let aspect = 1;
  const hemisphere = new THREE.HemisphereLight('#f2f5f2', '#9aa994', 2.2);
  scene.add(hemisphere);
  const sunlight = new THREE.DirectionalLight('#fff7ec', 2.75);
  sunlight.position.set(-3, 10, 6);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  Object.assign(sunlight.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: .5, far: 35 });
  sunlight.shadow.bias = -.0006;
  sunlight.shadow.normalBias = .035;
  sunlight.shadow.radius = 3;
  scene.add(sunlight);
  const fill = new THREE.DirectionalLight('#e4eef0', 1.1);
  fill.position.set(5, 5, -6);
  scene.add(fill);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: .035, color: '#48544b' }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 128;
  const context = shadowCanvas.getContext('2d')!;
  const gradient = context.createRadialGradient(64, 64, 5, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(62,76,67,.20)');
  gradient.addColorStop(.5, 'rgba(62,76,67,.10)');
  gradient.addColorStop(1, 'rgba(62,76,67,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const softShadow = new THREE.Mesh(new THREE.PlaneGeometry(17, 14), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }));
  softShadow.rotation.x = -Math.PI / 2;
  scene.add(softShadow);
  const lanterns = [[-2.2, .68, 1.3], [2.9, .68, 2.3], [-2.6, .68, -1.4], [3.1, .68, -1.8]].map(position => {
    const light = new THREE.PointLight('#ffd49c', 0, 2.6, 2);
    light.position.fromArray(position);
    island.add(light);
    return light;
  });
  let lanternMaterial: THREE.MeshStandardMaterial | undefined;
  let morph: ReturnType<typeof createMorph> | undefined;
  let chess: ReturnType<typeof createChessInteraction> | undefined;
  const islandMaterials = new Set<THREE.Material>();
  const materialOpacity = new Map<THREE.Material, number>();
  const koiPond = createKoiPond();
  island.add(koiPond.group);
  const pondSurfaces: THREE.Mesh[] = [];
  const pondObstacles: THREE.Mesh[] = [];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pondHit = new THREE.Vector3();
  const pondPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WATER_LEVEL);
  let pointerStart: { id: number; x: number; y: number } | null = null;
  let lastCall = -Infinity;
  const pondInteractive = () => loaded && !paused && !failed && journeyFrame(progress, reducedMotion).position < .42;
  const landmarkMeshes: THREE.Mesh[] = [];
  const landmarkTargets = new Map<THREE.Object3D, SectionId>();
  const landmarkMaterials = new Map<SectionId, Set<THREE.MeshStandardMaterial>>();
  const landmarks = createLandmarkInteraction({
    canvas, camera, pins, meshes: landmarkMeshes, targets: landmarkTargets, isActive: pondInteractive,
    onHighlight: id => {
      landmarkMaterials.forEach((materials, key) => materials.forEach(material => { material.emissiveIntensity = key === id ? .38 : 0; }));
      if (morph) {
        morph.mesh.material.emissive.set('#f4dba7');
        morph.mesh.material.emissiveIntensity = id === 'about' ? .3 : 0;
      }
      host.dataset.activeLandmark = id ?? '';
      invalidate();
    },
  });

  function pointInPond(event: PointerEvent) {
    if (!pondInteractive()) return false;
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.ray.intersectPlane(pondPlane, pondHit) !== null && isPondPoint(pondHit.x, pondHit.z);
  }
  function callKoi(x = POND_CALL_POINT.x, z = POND_CALL_POINT.z) {
    if (!pondInteractive() || performance.now() - lastCall < 250) return;
    if (koiPond.call(x, z, reducedMotion)) { lastCall = performance.now(); invalidate(); }
  }
  function clearPointer() { pointerStart = null; canvas.style.cursor = ''; }
  canvas.addEventListener('pointerdown', event => {
    pointerStart = event.isPrimary && event.button === 0 && pointInPond(event) ? { id: event.pointerId, x: event.clientX, y: event.clientY } : null;
  }, { signal: abort.signal });
  canvas.addEventListener('pointermove', event => {
    if (pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8) pointerStart = null;
    canvas.style.cursor = pointInPond(event) || host.dataset.activeLandmark ? 'pointer' : '';
  }, { signal: abort.signal });
  canvas.addEventListener('pointerup', event => {
    const start = pointerStart;
    pointerStart = null;
    if (!start || start.id !== event.pointerId || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8 || !pointInPond(event)) return;
    const hit = raycaster.intersectObjects(pondSurfaces, false)[0];
    if (!hit || pondObstacles.some(object => {
      const obstacle = raycaster.intersectObject(object, false)[0];
      return obstacle && obstacle.distance < hit.distance;
    })) return;
    callKoi(hit.point.x, hit.point.z);
  }, { signal: abort.signal });
  canvas.addEventListener('pointercancel', clearPointer, { signal: abort.signal });
  canvas.addEventListener('pointerleave', clearPointer, { signal: abort.signal });
  window.addEventListener('scroll', () => {
    clearPointer();
    if (chessOverheadScrollY === undefined || chessOverheadScrollY === window.scrollY) return;
    chessOverheadScrollY = undefined;
    invalidate();
  }, { passive: true, signal: abort.signal });
  window.addEventListener('blur', clearPointer, { signal: abort.signal });

  const mushroom = new THREE.Group();
  mushroom.position.set(4.65, .04, 2.9);
  island.add(mushroom);
  const mushroomCube = new THREE.BoxGeometry(1, 1, 1);
  const mushroomCap = new THREE.MeshStandardMaterial({ color: '#bd8998', roughness: .94, emissive: '#bf8293', emissiveIntensity: 0 });
  const mushroomCream = new THREE.MeshStandardMaterial({ color: '#e7dcc4', roughness: .94 });
  islandMaterials.add(mushroomCap); islandMaterials.add(mushroomCream);
  for (const [x, y, z, w, h, d, cream] of [
    [0, .19, 0, .21, .38, .22, 1], [0, .41, 0, .68, .17, .61, 0],
    [0, .54, 0, .50, .12, .47, 0], [0, .62, 0, .30, .06, .29, 0],
    [-.15, .61, .08, .13, .022, .11, 1], [.15, .61, -.13, .10, .022, .09, 1],
    [.06, .66, .04, .08, .021, .08, 1],
  ]) {
    const piece = new THREE.Mesh(mushroomCube, cream ? mushroomCream : mushroomCap);
    piece.position.set(x, y, z); piece.scale.set(w, h, d); piece.castShadow = true; mushroom.add(piece);
  }
  function highlightSecret() { mushroomCap.emissiveIntensity = .28; invalidate(); }
  function settleSecret() { mushroomCap.emissiveIntensity = 0; invalidate(); }
  secretButton?.addEventListener('pointerenter', highlightSecret, { signal: abort.signal });
  secretButton?.addEventListener('focus', highlightSecret, { signal: abort.signal });
  secretButton?.addEventListener('pointerleave', settleSecret, { signal: abort.signal });
  secretButton?.addEventListener('blur', settleSecret, { signal: abort.signal });

  // Atmospheric movement stays independent from the scroll-driven voxel morph.
  const weather = createGardenWeather(matchMedia('(max-width: 760px)').matches);
  scene.add(weather.group);
  island.add(weather.pond);
  const planted = new THREE.Group();
  island.add(planted);
  const contactFlowers = new THREE.Group();
  contactFlowers.visible = false;
  scene.add(contactFlowers);
  const plantGeometry = new THREE.BoxGeometry();
  const plantMaterial = new THREE.MeshStandardMaterial({ roughness: .94 });
  let plantSignature = '';
  let currentPlants: GardenPlant[] = [];
  const growingFlowers = new Set<THREE.Object3D>();
  const contactPlantModels = new Map<string, THREE.InstancedMesh>();
  function setPlants(plants: GardenPlant[]) {
    const signature = JSON.stringify(plants.map(({ id, kind, colors, design }) => ({ id, kind, colors, design })));
    if (plantSignature === signature) return;
    const previousIds = new Set(currentPlants.map(plant => plant.id));
    plantSignature = signature; currentPlants = plants;
    growingFlowers.clear(); contactPlantModels.clear();
    for (const group of [planted, contactFlowers]) {
      group.traverse(object => { if (object instanceof THREE.InstancedMesh) object.dispose(); });
      group.clear();
    }
    plants.forEach((plant, i) => {
      const angle = i * 2.399963;
      const radius = .32 + Math.sqrt(i) * .22;
      const flower = createPlantMesh(plant.kind, plant.colors, plantGeometry, plantMaterial, true, plant.design);
      flower.scale.setScalar(.52);
      flower.position.set(-2.75 + Math.cos(angle) * radius, .08, 2.8 + Math.sin(angle) * radius * .72);
      planted.add(flower);
      const contactFlower = flower.clone();
      const contactRadius = 1.65 + Math.sqrt(i) * .30;
      contactFlower.position.set(Math.cos(angle) * contactRadius - .3, .12, Math.sin(angle) * contactRadius * .84 + .1);
      contactFlower.scale.setScalar(.78);
      contactFlowers.add(contactFlower); contactPlantModels.set(plant.id, contactFlower);
      for (const [item, scale] of [[flower, .52], [contactFlower, .78]] as const) {
        item.userData.targetScale = scale;
        if (loaded && !reducedMotion && !previousIds.has(plant.id)) { item.scale.setScalar(.01); growingFlowers.add(item); }
      }
    });
    host.dataset.plantCount = String(plants.length);
    lastProgress = -1;
    renderer.shadowMap.needsUpdate = true;
    invalidate();
  }

  function invalidate() {
    dirty = true;
    if (!frame && !paused && !document.hidden && !disposed && !failed) frame = requestAnimationFrame(animate);
  }
  function updateCamera() {
    const pose = sampleJourneyCamera(progress, aspect, matchMedia('(max-width: 760px)').matches, reducedMotion, chessOverhead);
    target.fromArray(pose.target);
    camera.position.fromArray(pose.offset).add(target);
    camera.lookAt(target);
    const vertical = pose.vertical;
    camera.left = -vertical * aspect / 2;
    camera.right = vertical * aspect / 2;
    camera.top = vertical / 2;
    camera.bottom = -vertical / 2;
    camera.updateProjectionMatrix();
  }
  function resize() {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    aspect = width / height;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(width, height);
    lastExit = -1;
    invalidate();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  function onVisibility() {
    if (document.hidden) { clearPointer(); landmarks.clear(); cancelAnimationFrame(frame); frame = 0; }
    else { lastFrame = performance.now(); invalidate(); }
  }
  function onMotion(event: MediaQueryListEvent) {
    reducedMotion = event.matches;
    lastProgress = -1;
    lastExit = -1;
    invalidate();
  }
  function onContextLost(event: Event) {
    event.preventDefault();
    failed = true;
    chess?.update(0, reducedMotion);
    clearPointer();
    landmarks.clear();
    canvas.style.pointerEvents = 'none';
    if (pondButton) pondButton.hidden = true;
    cancelAnimationFrame(frame);
    frame = 0;
    callbacks.onError();
  }
  canvas.addEventListener('webglcontextlost', onContextLost);
  document.addEventListener('visibilitychange', onVisibility);
  motionPreference.addEventListener('change', onMotion);
  const projected = new THREE.Vector3();
  const chapterLights = sectionIds.map(id => ({
    sun: new THREE.Color(chapterAtmospheres[id].sun).lerp(new THREE.Color('#fff7ec'), .55),
    sky: new THREE.Color(chapterAtmospheres[id].sky).lerp(new THREE.Color('#f2f5f2'), .55),
    fill: new THREE.Color(chapterAtmospheres[id].fill).lerp(new THREE.Color('#e4eef0'), .55),
  }));
  const moonlight = new THREE.Color('#ccd9ec');
  const nightSky = new THREE.Color('#b4c5d4');
  const nightRim = new THREE.Color('#96b7c0');
  const dayGround = new THREE.Color('#9aa994');
  const nightGround = new THREE.Color('#3f554f');
  const rainSky = new THREE.Color('#bfd5dc');


  function animate(now: number) {
    frame = 0;
    if (disposed || failed || paused || document.hidden) return;
    const dt = Math.min((now - lastFrame) / 1000, .05);
    lastFrame = now;
    const state = journeyFrame(progress, reducedMotion);
    const exit = state.from === 0 ? state.mix : 1;
    const petalOpacity = state.from < 1 ? 1 : state.from === 1 ? 1 - state.mix : 0;
    const ambient = !reducedMotion && petalOpacity > 0 && loaded;
    const changingLight = Math.abs(night - nightTarget) > .001;
    const rainTarget = mood === 'rain' ? petalOpacity : 0;
    const changingWeather = Math.abs(rainLight - rainTarget) > .001;
    const atChessboard = chessIsInteractive(progress, reducedMotion);
    const overheadTarget = atChessboard && chessOverheadScrollY !== undefined ? 1 : 0;
    const cameraMoving = chessOverhead !== overheadTarget && (!atChessboard || !chess?.pointerDown);
    if (dirty || ambient || changingLight || changingWeather || cameraMoving || growingFlowers.size > 0) {
      dirty = false;
      const cameraChanged = progress !== lastProgress || exit !== lastExit || cameraMoving;
      if (cameraMoving) {
        const blend = reducedMotion || !atChessboard
          ? overheadTarget
          : THREE.MathUtils.damp(chessOverhead, overheadTarget, 14, Math.min(dt, .025));
        chessOverhead = Math.abs(blend - overheadTarget) < .002 ? overheadTarget : blend;
      }
      if (cameraChanged) updateCamera();
      chess?.update(progress, reducedMotion, chessOverhead);
      const geometryChanged = morph?.update(progress, reducedMotion);
      if (!pondInteractive()) landmarks.clear();
      if (geometryChanged || cameraChanged) renderer.shadowMap.needsUpdate = true;
      if (lastExit !== exit) {
        island.scale.setScalar(THREE.MathUtils.lerp(1, .76, exit));
        island.position.y = -2.0 * exit;
        island.rotation.y = -.08 * exit;
        island.visible = exit < .999;
        islandMaterials.forEach(material => {
          const baseOpacity = materialOpacity.get(material) ?? 1;
          const transparent = exit > 0 || baseOpacity < 1;
          if (material.transparent !== transparent) { material.transparent = transparent; material.needsUpdate = true; }
          material.opacity = (1 - exit) * baseOpacity;
          material.depthWrite = exit < .45 && baseOpacity === 1;
        });
        ground.position.y = THREE.MathUtils.lerp(-1.75, -.35, exit);
        softShadow.position.y = ground.position.y - .01;
        softShadow.scale.setScalar(THREE.MathUtils.lerp(1, .45, exit));
        lastExit = exit;
      }
      const contactMix = state.from === 6 ? state.mix : state.from === 7 ? 1 : 0;
      contactFlowers.visible = contactMix > .001;
      contactFlowers.scale.setScalar(Math.max(.001, contactMix));
      night = reducedMotion || !changingLight ? nightTarget : THREE.MathUtils.damp(night, nightTarget, 5, dt);
      rainLight = reducedMotion || !changingWeather ? rainTarget : THREE.MathUtils.damp(rainLight, rainTarget, 5, dt);
      const sourceLight = chapterLights[state.from], nextLight = chapterLights[state.to];
      sunlight.color.lerpColors(sourceLight.sun, nextLight.sun, state.mix).lerp(moonlight, night * .94);
      sunlight.color.lerp(rainSky, rainLight * .65);
      sunlight.intensity = THREE.MathUtils.lerp(2.75, 1.35, night) * (1 - rainLight * .24);
      hemisphere.color.lerpColors(sourceLight.sky, nextLight.sky, state.mix).lerp(nightSky, night);
      hemisphere.groundColor.lerpColors(dayGround, nightGround, night);
      hemisphere.intensity = THREE.MathUtils.lerp(2.2, 1.0, night);
      fill.color.lerpColors(sourceLight.fill, nextLight.fill, state.mix).lerp(nightRim, night);
      fill.intensity = THREE.MathUtils.lerp(1.1, .8, night);
      ground.material.opacity = THREE.MathUtils.lerp(.035, .12, night);
      softShadow.material.opacity = THREE.MathUtils.lerp(1, .45, night);
      renderer.toneMappingExposure = THREE.MathUtils.lerp(1.03, 1, night);
      lanterns.forEach(light => { light.intensity = night * 1.6; });
      if (lanternMaterial) lanternMaterial.emissiveIntensity = night * 1.35;
      weather.update(dt, reducedMotion, loaded ? petalOpacity : 0, loaded ? 1 - exit : 0, camera.quaternion, night);
      koiPond.update(loaded ? dt : 0, reducedMotion, loaded ? 1 - exit : 0);
      growingFlowers.forEach(flower => {
        const goal = flower.userData.targetScale as number;
        const size = reducedMotion ? goal : THREE.MathUtils.damp(flower.scale.x, goal, 7, dt);
        flower.scale.setScalar(size);
        if (Math.abs(size - goal) < .005) { flower.scale.setScalar(goal); growingFlowers.delete(flower); }
        renderer.shadowMap.needsUpdate = true;
      });
      // Project accessible HTML targets over the real voxel plants at Contact.
      camera.updateMatrixWorld(); contactFlowers.updateWorldMatrix(true, true);
      plantPins.forEach((pin, id) => {
        const model = contactPlantModels.get(id);
        const visible = loaded && contactMix > .95 && !!model;
        pin.hidden = !visible; pin.tabIndex = visible ? 0 : -1;
        if (!model || !visible) return;
        projected.set(0, .65, 0).applyMatrix4(model.matrixWorld).project(camera);
        pin.style.left = `${(projected.x * .5 + .5) * 100}%`;
        pin.style.top = `${(-projected.y * .5 + .5) * 100}%`;
      });
      if (lastProgress !== progress || geometryChanged || cameraChanged) {
        camera.updateMatrixWorld();
        const pinOpacity = 1 - smoothstep((state.position - .42) / .20);
        gardenPins.forEach(item => {
          const pin = pins.get(item.id);
          if (!pin) return;
          projected.fromArray(item.position).project(camera);
          pin.style.left = `${(projected.x * .5 + .5) * 100}%`;
          pin.style.top = `${(-projected.y * .5 + .5) * 100}%`;
          pin.dataset.placement = (-projected.y * .5 + .5) * host.clientHeight < 52 ? 'below' : 'above';
          pin.style.opacity = `${pinOpacity}`;
          pin.style.visibility = pinOpacity > .01 && loaded ? 'visible' : 'hidden';
          pin.tabIndex = pinOpacity > .9 && loaded ? 0 : -1;
        });
        if (secretButton) {
          mushroom.updateWorldMatrix(true, false);
          projected.set(0, .48, 0).applyMatrix4(mushroom.matrixWorld).project(camera);
          secretButton.style.left = `${(projected.x * .5 + .5) * 100}%`;
          secretButton.style.top = `${(-projected.y * .5 + .5) * 100}%`;
          secretButton.hidden = !loaded || pinOpacity < .9;
          secretButton.tabIndex = loaded && pinOpacity >= .9 ? 0 : -1;
        }
        canvas.style.pointerEvents = pondInteractive() || host.dataset.chessActive === 'true' ? 'auto' : 'none';
        if (!pondInteractive()) clearPointer();
        if (pondButton) {
          projected.set(POND_CALL_POINT.x, WATER_LEVEL, POND_CALL_POINT.z).project(camera);
          pondButton.style.left = `${(projected.x * .5 + .5) * 100}%`;
          pondButton.style.top = `${(-projected.y * .5 + .5) * 100}%`;
          pondButton.hidden = !pondInteractive();
          pondButton.tabIndex = pondInteractive() ? 0 : -1;
        }
        lastProgress = progress;
      }
      host.dataset.journeyProgress = progress.toFixed(6);
      host.dataset.shapeFrom = state.section;
      host.dataset.morph = state.mix.toFixed(4);
      renderer.render(scene, camera);
    }
    if (ambient || changingLight || changingWeather || (cameraMoving && chessOverhead !== overheadTarget) || growingFlowers.size > 0) frame = requestAnimationFrame(animate);
  }

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  async function get(url: string) {
    const response = await fetch(url, { signal: abort.signal });
    if (!response.ok) throw new Error(`Garden asset returned ${response.status}`);
    return response;
  }
  async function load() {
    let model: THREE.Group | undefined;
    try {
      const [modelBytes, manifest, voxelBytes] = await Promise.all([
        get(`${import.meta.env.BASE_URL}models/garden.glb`).then(r => r.arrayBuffer()),
        get(`${import.meta.env.BASE_URL}models/journey-voxels.json`).then(r => r.json() as Promise<VoxelManifest>),
        get(`${import.meta.env.BASE_URL}models/journey-voxels.bin`).then(r => r.arrayBuffer()),
      ]);
      if (disposed) return;
      callbacks.onProgress(65);
      const gltf = await loader.parseAsync(modelBytes, `${import.meta.env.BASE_URL}models/`);
      model = gltf.scene;
      if (disposed) { disposeTree(model); return; }
      morph = createMorph(manifest, voxelBytes);
      chess = createChessInteraction({
        host, camera, scene, morph, squares: chessSquares, invalidate,
        onChange: callbacks.onChessChange,
        onRequestOverhead: () => { chessOverheadScrollY = window.scrollY; },
      });
      morph.update(progress, reducedMotion);
      scene.add(morph.mesh);
      model.updateMatrixWorld(true);
      model.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        paintGardenGeometry(object.geometry);
        object.castShadow = true;
        object.receiveShadow = true;
        // The shared authoring data reproduces these three meshes exactly.
        if (object.name.startsWith('Story_cherry')) object.visible = false;
        // Original cherry meshes are exact, inexpensive picking proxies for the voxel tree.
        landmarkMeshes.push(object);
        const landmark = gardenPins.find(pin => pin.meshPrefixes.some(prefix => object.name.startsWith(prefix)));
        if (landmark) {
          landmarkTargets.set(object, landmark.id);
          if (object.visible) {
            const materials = (Array.isArray(object.material) ? object.material : [object.material]).map(material => {
              const highlighted = (material as THREE.MeshStandardMaterial).clone();
              highlighted.emissive.set('#f4dba7');
              highlighted.emissiveIntensity = 0;
              const group = landmarkMaterials.get(landmark.id) ?? new Set<THREE.MeshStandardMaterial>();
              group.add(highlighted); landmarkMaterials.set(landmark.id, group);
              return highlighted;
            });
            object.material = Array.isArray(object.material) ? materials : materials[0];
          }
        }
        const name = object.name.toLowerCase();
        if (name.includes('pond_water')) {
          // Only the surface is translucent; internal cube walls would tint each
          // fish repeatedly and reveal a grid of overlapping underwater faces.
          const normals = object.geometry.getAttribute('normal');
          const index = object.geometry.getIndex();
          const normalMatrix = new THREE.Matrix3().getNormalMatrix(object.matrixWorld);
          const normal = new THREE.Vector3();
          const surface: number[] = [];
          for (let i = 0; i < (index?.count ?? normals.count); i += 3) {
            const vertex = index ? index.getX(i) : i;
            normal.fromBufferAttribute(normals, vertex).applyMatrix3(normalMatrix).normalize();
            if (normal.y > .99) surface.push(vertex, index ? index.getX(i + 1) : i + 1, index ? index.getX(i + 2) : i + 2);
          }
          object.geometry.setIndex(surface);
          object.material = (object.material as THREE.MeshStandardMaterial).clone();
          const water = object.material as THREE.MeshStandardMaterial;
          water.roughness = .24;
          water.metalness = .03;
          water.transparent = true;
          water.opacity = .28;
          water.depthWrite = false;
          materialOpacity.set(water, water.opacity);
          object.castShadow = false;
          pondSurfaces.push(object);
        } else if (object.visible) {
          pondObstacles.push(object);
        }
        if (name.includes('lantern_glass')) {
          lanternMaterial = (object.material as THREE.MeshStandardMaterial).clone();
          lanternMaterial.emissive.set('#ffd49c');
          lanternMaterial.emissiveIntensity = 0;
          object.material = lanternMaterial;
        }
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => islandMaterials.add(material));
      });
      island.add(model);
      loaded = true;
      lastProgress = -1;
      lastExit = -1;
      renderer.shadowMap.needsUpdate = true;
      callbacks.onProgress(100);
      callbacks.onReady();
      invalidate();
    } catch (error) {
      if (model && !model.parent) disposeTree(model);
      if (!disposed && !(error instanceof DOMException && error.name === 'AbortError')) {
        failed = true;
        cancelAnimationFrame(frame);
        frame = 0;
        callbacks.onError();
      }
    }
  }
  void load();

  return {
    setJourneyProgress: value => { progress = clamp(value); invalidate(); },
    setTheme: theme => {
      nightTarget = theme === 'dark' ? 1 : 0;
      if (!loaded) night = nightTarget;
      invalidate();
    },
    setMood: value => { mood = value; weather.setMood(value); host.dataset.gardenMood = value; invalidate(); },
    makeWish: () => {
      if (!loaded || paused || failed || journeyFrame(progress, reducedMotion).from > 1) return;
      weather.makeWish(); invalidate();
    },
    setPlants,
    focusChessBoard: reveal => {
      if (reveal) {
        host.closest('.garden-stage')?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
        if (chessOverheadScrollY !== undefined) chessOverheadScrollY = window.scrollY;
      }
      for (const square of chessSquares.values()) {
        if (square.tabIndex !== 0) continue;
        square.focus({ preventScroll: true });
        break;
      }
    },
    selectChessSquare: square => chess?.selectSquare(square),
    focusChessSquare: square => chess?.focusSquare(square),
    clearChessSelection: () => chess?.clearSelection(),
    chooseChessPromotion: kind => chess?.choosePromotion(kind),
    cancelChessPromotion: () => chess?.cancelPromotion(),
    undoChess: () => chess?.undo(),
    resetChess: () => chess?.reset(),
    callKoi: () => callKoi(),
    setPaused: value => {
      paused = value;
      host.dataset.paused = String(value);
      if (paused) { chess?.cancelInteraction(); clearPointer(); landmarks.clear(); canvas.style.pointerEvents = 'none'; cancelAnimationFrame(frame); frame = 0; }
      else { lastFrame = performance.now(); lastProgress = -1; invalidate(); }
    },
    dispose: () => {
      disposed = true;
      chess?.dispose();
      landmarks.dispose();
      abort.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      document.removeEventListener('visibilitychange', onVisibility);
      motionPreference.removeEventListener('change', onMotion);
      disposeTree(scene);
      if (!currentPlants.length) { plantGeometry.dispose(); plantMaterial.dispose(); }
      renderer.dispose();
      canvas.remove();
    },
  };
}

function disposeTree(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (object instanceof THREE.InstancedMesh) object.dispose();
    if (object instanceof THREE.Mesh) {
      geometries.add(object.geometry);
      (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
    }
    if (object instanceof THREE.Light && 'shadow' in object) (object as THREE.DirectionalLight).shadow?.dispose();
  });
  materials.forEach(material => {
    Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); });
    material.dispose();
  });
  geometries.forEach(geometry => geometry.dispose());
  textures.forEach(texture => texture.dispose());
}
