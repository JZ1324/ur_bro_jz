import * as THREE from 'three';
import { fishCatalog, getFish, seededRandom, type Fish } from './catalog';
import { fishVoxels, rainbowColors } from './voxels';

function createAuraTexture() {
  const width = 256, height = 128, pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const u = x / (width - 1), v = y / (height - 1);
    const radius = Math.hypot(u * 2 - 1, v * 2 - 1);
    const index = (y * width + x) * 4;
    pixels[index] = 255; pixels[index + 1] = 255; pixels[index + 2] = 255;
    pixels[index + 3] = Math.round(255 * Math.exp(-radius * radius * 2.2) * Math.max(0, Math.min(1, (1 - radius) / .18)));
  }
  const texture = new THREE.DataTexture(pixels, width, height);
  texture.colorSpace = THREE.SRGBColorSpace; texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function createOcean(host: HTMLElement, onError: () => void, onMeet: (id: string) => void) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#0c3540', .025);
  const camera = new THREE.OrthographicCamera(-10, 10, 6, -6, .1, 100);
  camera.position.set(9, 9, 13); camera.lookAt(0, 1, 0);
  camera.updateMatrixWorld();
  scene.add(new THREE.AmbientLight('#d9f4e6', 2.2));
  const sunlight = new THREE.DirectionalLight('#ffead0', 3.2);
  sunlight.position.set(-6, 12, 8); scene.add(sunlight);
  const blueLight = new THREE.DirectionalLight('#74d8ed', 2);
  blueLight.position.set(9, 3, -7); scene.add(blueLight);
  const cube = new THREE.BoxGeometry();
  const reefMaterial = new THREE.MeshStandardMaterial({ roughness: .95, metalness: 0 });
  const fishMaterial = new THREE.MeshStandardMaterial({ roughness: .6, metalness: .06 });
  const legendaryMaterial = new THREE.MeshStandardMaterial({ roughness: .4, metalness: .18 });
  const mythicMaterial = new THREE.MeshStandardMaterial({ roughness: .4, metalness: .14, emissive: '#644568', emissiveIntensity: .14 });
  const ultraMaterial = new THREE.MeshStandardMaterial({ roughness: .3, metalness: .25, emissive: '#d8efff', emissiveIntensity: .09 });
  const auraTexture = createAuraTexture(), auraGeometry = new THREE.PlaneGeometry(1, 1);
  const auraMaterial = new THREE.MeshBasicMaterial({ map: auraTexture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: .68 });
  const rainbowShades = rainbowColors.map(color => new THREE.Color(color));
  const viewPoint = new THREE.Vector3(), groupView = new THREE.Matrix4(), partView = new THREE.Matrix4(), partMatrix = new THREE.Matrix4();
  const auraTransform = new THREE.Object3D(); auraTransform.quaternion.copy(camera.quaternion);
  const transform = new THREE.Object3D(), shade = new THREE.Color();
  const rng = seededRandom(208);
  const reefParts: { x: number; y: number; z: number; w: number; h: number; d: number; color: string }[] = [];
  const block = (x: number, y: number, z: number, w: number, h: number, d: number, color: string) => reefParts.push({ x, y, z, w, h, d, color });
  block(0, -.48, 0, 17, .45, 7.2, '#27656a');
  block(0, -.22, 0, 16.4, .25, 6.8, '#4f9290');
  block(-.1, -.03, 0, 15.6, .17, 6.25, '#8db4a1');
  block(.6, .06, .4, 11, .1, 3.7, '#bfc8a1');
  // Little islands of coral leave the middle of the reef open for swimming.
  const coralColors = ['#df9b96', '#ce8194', '#e6b386', '#86b9a4', '#81b6bb', '#b39dbd'];
  for (let i = 0; i < 30; i++) {
    const x = (rng() - .5) * 14, z = (i % 2 ? -1 : 1) * (1.65 + rng() * 1.1);
    const color = coralColors[i % coralColors.length], height = .35 + rng() * .85;
    block(x, height / 2 + .08, z, .16, height, .18, color);
    for (const side of [-1, 1]) {
      block(x + side * .2, height * .52, z, .35, .13, .2, color);
      block(x + side * .34, height * .73, z, .13, height * .45, .16, color);
      if (i % 3 === 0) block(x + side * .34, height * .99, z, .25, .13, .24, '#f6d3bd');
    }
  }
  for (let i = 0; i < 15; i++) {
    const x = (rng() - .5) * 14.5, z = (rng() - .5) * 5.5;
    block(x, .16, z, .35 + rng() * .4, .24, .3 + rng() * .4, i % 2 ? '#819f93' : '#779a96');
    if (i % 4 === 0) for (let j = 0; j < 3; j++) {
      const height = .6 + rng() * .9;
      block(x + j * .15, height / 2 + .1, z, .08, height, .1, j % 2 ? '#5f9f80' : '#78b796');
      block(x + j * .15 + .1, height * .7, z, .22, .09, .1, '#78b796');
    }
  }
  block(-5.5, .6, -.5, .75, 1.2, .8, '#688e88');
  block(-3.7, .6, -.5, .75, 1.2, .8, '#779c8b');
  block(-4.6, 1.25, -.5, 2.6, .5, .95, '#88a899');
  const reef = new THREE.InstancedMesh(cube, reefMaterial, reefParts.length);
  reefParts.forEach((part, index) => {
    transform.position.set(part.x, part.y, part.z); transform.scale.set(part.w, part.h, part.d); transform.rotation.set(0, 0, 0); transform.updateMatrix();
    reef.setMatrixAt(index, transform.matrix); reef.setColorAt(index, shade.set(part.color));
  });
  scene.add(reef);

  const bubbleGeometry = new THREE.RingGeometry(1, 1.12, 20);
  const bubbleMaterial = new THREE.MeshBasicMaterial({ color: '#c7eee4', transparent: true, opacity: .65, depthWrite: false, side: THREE.DoubleSide });
  const bubbles = new THREE.Group(), bubbleOrigin = new THREE.Vector3();
  const bubbleMeshes = Array.from({ length: 7 }, () => {
    const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial); bubble.quaternion.copy(camera.quaternion); bubbles.add(bubble); return bubble;
  });
  bubbles.visible = false; scene.add(bubbles);
  let bubbleStarted = 0, bubbleActive = false, bubbleTimer: ReturnType<typeof setTimeout> | undefined, metIndex = -1;
  type Swimmer = { fish: Fish; group: THREE.Group; mesh: THREE.InstancedMesh; pickPoint: THREE.Vector3; aura: THREE.InstancedMesh | null; auraParts: number[]; bounds: THREE.Box3 | null; parts: ReturnType<typeof fishVoxels>; phase: number; rx: number; rz: number; y: number; speed: number; greetingDelay: number; lastPose: number };
  let swimmers: Swimmer[] = [];
  let elapsed = 0, last = 0, frame = 0, paused = true, lost = false, disposed = false;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  function setFish(ids: string[], previewId: string | null = null) {
    bubbleActive = false; clearTimeout(bubbleTimer); metIndex = -1;
    for (const swimmer of swimmers) { scene.remove(swimmer.group); if (swimmer.aura) { scene.remove(swimmer.aura); swimmer.aura.dispose(); } swimmer.mesh.dispose(); }
    const preview = previewId ? getFish(previewId) : undefined;
    const owned = ids.filter(id => id !== preview?.id).map(getFish).filter((fish): fish is Fish => !!fish).slice(0, 18);
    const featured = preview ? [preview, ...owned] : owned;
    const ambient = [fishCatalog[0], fishCatalog[1], fishCatalog[3], fishCatalog[4], fishCatalog[2], fishCatalog[0]];
    const inhabitants = [...featured, ...ambient.slice(0, Math.max(3, 9 - featured.length))];
    const fishRng = seededRandom(49);
    swimmers = inhabitants.map((fish, index) => {
      const material = fish.rarity === 'ultra' ? ultraMaterial : fish.rarity === 'mythic' ? mythicMaterial : fish.rarity === 'legendary' ? legendaryMaterial : fishMaterial;
      const parts = fishVoxels(fish), mesh = new THREE.InstancedMesh(cube, material, parts.length), group = new THREE.Group();
      const bodyPart = parts.reduce((largest, part) => part.w * part.h * part.d > largest.w * largest.h * largest.d ? part : largest);
      const pickPoint = new THREE.Vector3(bodyPart.x, bodyPart.y, bodyPart.z);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      parts.forEach((part, partIndex) => mesh.setColorAt(partIndex, shade.set(part.color)));
      const extent = Math.max(...parts.map(part => Math.hypot(Math.abs(part.x) + part.w / 2, Math.abs(part.z) + part.d / 2)));
      const scale = Math.min(fish.size * (index < featured.length ? 1.5 : 1.65), 3.2 / extent);
      group.add(mesh); group.scale.setScalar(scale); scene.add(group);
      let aura: THREE.InstancedMesh | null = null, bounds: THREE.Box3 | null = null;
      const auraParts: number[] = [];
      if (fish.finish === 'rainbow-glow') {
        bounds = new THREE.Box3();
        for (const part of parts) {
          bounds.expandByPoint(viewPoint.set(part.x - part.w / 2, part.y - part.h / 2, part.z - part.d / 2));
          bounds.expandByPoint(viewPoint.set(part.x + part.w / 2, part.y + part.h / 2, part.z + part.d / 2));
        }
        bounds.expandByScalar(.1);
        parts.forEach((part, partIndex) => { if (fish.colors.includes(part.color) && part.w * part.h * part.d > .001) auraParts.push(partIndex); });
        aura = new THREE.InstancedMesh(auraGeometry, auraMaterial, auraParts.length);
        aura.instanceMatrix.setUsage(THREE.DynamicDrawUsage); aura.frustumCulled = false;
        auraParts.forEach((partIndex, auraIndex) => {
          const band = Math.max(0, Math.min(1, (parts[partIndex].x - bounds!.min.x) / (bounds!.max.x - bounds!.min.x))) * (rainbowShades.length - 1);
          const left = Math.floor(band), right = Math.min(left + 1, rainbowShades.length - 1);
          aura!.setColorAt(auraIndex, shade.copy(rainbowShades[left]).lerp(rainbowShades[right], band - left));
        });
        scene.add(aura);
      }
      const phase = fishRng() * Math.PI * 2, rx = 3 + fishRng() * 3.1, rz = .65 + fishRng() * 1.45;
      // Keep tentacles above the sand, and leave room for the larger sea creatures.
      const floor = Math.min(...parts.map(part => part.y - part.h / 2));
      return { fish, group, mesh, pickPoint, aura, auraParts, bounds, parts, phase: preview && index === 0 ? Math.PI / 2 : phase, rx, rz, greetingDelay: 0, lastPose: elapsed,
        y: Math.max(.8 + fishRng() * 1.9, .45 - floor * scale), speed: (.14 + fishRng() * .09) * (index % 2 ? -1 : 1) };
    });
    render();
  }
  function pose() {
    auraMaterial.opacity = preference.matches ? .68 : .68 + Math.sin(elapsed * 1.4) * .04;
    for (const swimmer of swimmers) {
      // A friend holds still for its brief hello, then carries on from that spot.
      if (swimmers[metIndex] === swimmer && bubbleActive && elapsed - bubbleStarted < 1.5) swimmer.greetingDelay += elapsed - swimmer.lastPose;
      swimmer.lastPose = elapsed;
      const time = (elapsed - swimmer.greetingDelay) * swimmer.speed + swimmer.phase;
      swimmer.group.position.set(Math.cos(time) * swimmer.rx, swimmer.y + Math.sin(time * 2) * .18, Math.sin(time) * swimmer.rz);
      const dx = -Math.sin(time) * swimmer.rx * swimmer.speed, dz = Math.cos(time) * swimmer.rz * swimmer.speed;
      swimmer.group.rotation.y = Math.atan2(-dz, dx);
      swimmer.parts.forEach((part, index) => {
        const wag = part.tail && !preference.matches ? Math.sin(elapsed * 5 + swimmer.phase) * .10 : 0;
        transform.position.set(part.x, part.y, part.z + wag); transform.rotation.set(0, wag * 1.4, 0); transform.scale.set(part.w, part.h, part.d); transform.updateMatrix();
        swimmer.mesh.setMatrixAt(index, transform.matrix);
      });
      swimmer.mesh.instanceMatrix.needsUpdate = true;
      if (swimmer.aura && swimmer.bounds) {
        swimmer.group.updateMatrixWorld();
        groupView.multiplyMatrices(camera.matrixWorldInverse, swimmer.group.matrixWorld);
        const { min, max } = swimmer.bounds;
        let farDepth = Infinity;
        for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) {
          viewPoint.set(x, y, z).applyMatrix4(groupView);
          farDepth = Math.min(farDepth, viewPoint.z);
        }
        // Soft patches follow the actual blocks, behind the body so its palette stays intact.
        swimmer.auraParts.forEach((partIndex, auraIndex) => {
          swimmer.mesh.getMatrixAt(partIndex, partMatrix); partView.multiplyMatrices(groupView, partMatrix);
          const matrix = partView.elements;
          const width = Math.abs(matrix[0]) + Math.abs(matrix[4]) + Math.abs(matrix[8]);
          const height = Math.abs(matrix[1]) + Math.abs(matrix[5]) + Math.abs(matrix[9]);
          auraTransform.position.set(matrix[12], matrix[13], farDepth - .08).applyMatrix4(camera.matrixWorld);
          auraTransform.scale.set(width + 1, height + 1, 1); auraTransform.updateMatrix();
          swimmer.aura!.setMatrixAt(auraIndex, auraTransform.matrix);
        });
        swimmer.aura.instanceMatrix.needsUpdate = true;
      }
    }
    const bubbleAge = elapsed - bubbleStarted;
    bubbles.visible = bubbleActive && (preference.matches || bubbleAge < 1.5);
    if (bubbles.visible) {
      bubbleMaterial.opacity = preference.matches ? .65 : .65 * Math.max(0, 1 - bubbleAge / 1.5);
      bubbleMeshes.forEach((bubble, index) => {
        const rise = preference.matches ? .45 + index * .1 : Math.max(0, bubbleAge - index * .07);
        bubble.position.set(bubbleOrigin.x + Math.sin(index * 2.2) * (.12 + rise * .12), bubbleOrigin.y + .2 + rise * 1.3, bubbleOrigin.z + Math.cos(index * 2.2) * .13);
        bubble.scale.setScalar(.055 + index % 3 * .018);
      });
    }
  }
  function render() { if (!disposed && !lost) { pose(); renderer.render(scene, camera); } }
  function animate(now: number) {
    frame = 0;
    if (disposed || paused || lost || document.hidden || preference.matches) return;
    if (!last || now - last >= 1000 / 30) {
      elapsed += last ? Math.min((now - last) / 1000, .08) : 0; last = now; render();
    }
    frame = requestAnimationFrame(animate);
  }
  function wake() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    if (!paused && !document.hidden && !preference.matches && !lost) frame = requestAnimationFrame(animate);
    else render();
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    const aspect = width / height, halfWidth = aspect < 1.4 ? 9.4 : 9.8;
    // Bring the fish closer while keeping the full reef visible on narrow screens.
    const halfHeight = Math.max(halfWidth / aspect, 4.2);
    camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect; camera.top = halfHeight; camera.bottom = -halfHeight;
    camera.updateProjectionMatrix(); renderer.setSize(width, height, false); render();
  }
  function contextLost(event: Event) { event.preventDefault(); lost = true; cancelAnimationFrame(frame); onError(); }
  function meet(swimmer: Swimmer) {
    if (paused || disposed || lost) return;
    metIndex = swimmers.indexOf(swimmer); bubbleOrigin.copy(swimmer.group.position); bubbleStarted = elapsed; bubbleActive = true;
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => { bubbleActive = false; if (!paused && !document.hidden) render(); }, 1800);
    onMeet(swimmer.fish.id); render(); wake();
  }
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), events = new AbortController();
  function hit(event: PointerEvent) {
    if (paused || disposed || lost) return;
    const bounds = host.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const objects = [reef, ...swimmers.map(swimmer => swimmer.mesh)];
    const result = raycaster.intersectObjects(objects, false)[0];
    const direct = result && swimmers.find(swimmer => swimmer.mesh === result.object);
    if (direct || (event.pointerType !== 'touch' && bounds.width > 760)) return direct;
    // Small phone fish get a 44px target. Hidden fish remain behind their coral.
    let nearest: Swimmer | undefined, distance = 22;
    for (const swimmer of swimmers) {
      const centre = viewPoint.copy(swimmer.pickPoint).applyMatrix4(swimmer.mesh.matrixWorld).project(camera);
      const gap = Math.hypot(event.clientX - bounds.left - (centre.x + 1) / 2 * bounds.width, event.clientY - bounds.top - (1 - centre.y) / 2 * bounds.height);
      if (gap >= distance || Math.abs(centre.x) > 1 || Math.abs(centre.y) > 1) continue;
      pointer.set(centre.x, centre.y); raycaster.setFromCamera(pointer, camera);
      if (raycaster.intersectObjects(objects, false)[0]?.object !== swimmer.mesh) continue;
      nearest = swimmer; distance = gap;
    }
    return nearest;
  }
  let press: { x: number; y: number; id: number } | null = null;
  host.addEventListener('pointerdown', event => { if (event.isPrimary && event.button === 0) press = { x: event.clientX, y: event.clientY, id: event.pointerId }; }, { signal: events.signal });
  host.addEventListener('pointerup', event => {
    const start = press; press = null;
    if (!start || start.id !== event.pointerId || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) return;
    const swimmer = hit(event); if (swimmer) meet(swimmer);
  }, { signal: events.signal });
  host.addEventListener('pointercancel', () => { press = null; }, { signal: events.signal });
  host.addEventListener('pointerleave', () => { press = null; host.style.cursor = ''; }, { signal: events.signal });
  host.addEventListener('pointermove', event => { if (event.pointerType === 'mouse') host.style.cursor = hit(event) ? 'pointer' : ''; }, { signal: events.signal });
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  preference.addEventListener('change', wake); document.addEventListener('visibilitychange', wake);
  resize(); setFish([]);
  return {
    setFish,
    meetNext() { const swimmer = swimmers[(metIndex + 1) % swimmers.length]; if (swimmer) meet(swimmer); },
    setPaused(value: boolean) { paused = value; wake(); },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); clearTimeout(bubbleTimer); events.abort(); resizeObserver.disconnect(); host.style.cursor = '';
      preference.removeEventListener('change', wake); document.removeEventListener('visibilitychange', wake);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      swimmers.forEach(swimmer => { swimmer.mesh.dispose(); swimmer.aura?.dispose(); }); reef.dispose(); cube.dispose(); reefMaterial.dispose();
      fishMaterial.dispose(); legendaryMaterial.dispose(); mythicMaterial.dispose(); ultraMaterial.dispose();
      auraGeometry.dispose(); auraMaterial.dispose(); auraTexture.dispose();
      bubbleGeometry.dispose(); bubbleMaterial.dispose();
      renderer.dispose(); renderer.domElement.remove();
    },
  };
}
