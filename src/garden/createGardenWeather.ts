import * as THREE from 'three';
import { isPondPoint, WATER_LEVEL } from './koi';
import { gardenMoods, type GardenMood } from './mood';

const seed = (n: number) => { const value = Math.sin(n * 127.1 + 311.7) * 43758.5453; return value - Math.floor(value); };
const wrap = (value: number, size: number) => ((value % size) + size) % size;
const WISH_SECONDS = 5;

function glowTexture() {
  const size = 32;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const radius = Math.hypot((x + .5 - size / 2) / (size / 2), (y + .5 - size / 2) / (size / 2));
    const index = (y * size + x) * 4;
    pixels[index] = pixels[index + 1] = pixels[index + 2] = 255;
    pixels[index + 3] = Math.round(Math.max(0, 1 - radius) ** 3 * 255);
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.needsUpdate = true;
  return texture;
}

/** One small set of instanced particles, driven by the garden's existing render loop. */
export function createGardenWeather(compact: boolean) {
  const group = new THREE.Group();
  const pond = new THREE.Group();
  group.name = 'Garden_atmosphere';
  pond.name = 'Rain_on_the_pond';
  const dummy = new THREE.Object3D();
  const texture = glowTexture();
  let mood: GardenMood = 'breeze';
  let time = 0;
  let wishAge = WISH_SECONDS;
  const weights: Record<GardenMood, number> = { breeze: 1, rain: 0, fireflies: 0 };

  function instances(name: string, geometry: THREE.BufferGeometry, material: THREE.MeshBasicMaterial | THREE.MeshStandardMaterial, count: number, parent = group) {
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.name = name;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    parent.add(mesh);
    return mesh;
  }
  const petals = instances('Blossom_petals', new THREE.BoxGeometry(.075, .022, .12), new THREE.MeshStandardMaterial({ color: '#efb3c5', roughness: .85, transparent: true, depthWrite: false }), compact ? 38 : 76);
  const rain = instances('Passing_rain', new THREE.BoxGeometry(.011, .24, .011), new THREE.MeshBasicMaterial({ color: '#8eafb8', transparent: true, depthWrite: false }), compact ? 100 : 200);
  const fireflies = instances('Fireflies', new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#ffe79a', map: texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), compact ? 32 : 58);
  const wishes = instances('Wish_lights', fireflies.geometry, new THREE.MeshBasicMaterial({ color: '#ffd99b', map: texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), compact ? 42 : 72);
  const rippleGeometry = new THREE.RingGeometry(.85, 1, 24);
  rippleGeometry.rotateX(-Math.PI / 2);
  const ripples = instances('Rain_ripples', rippleGeometry, new THREE.MeshBasicMaterial({ color: '#d7eeea', transparent: true, depthWrite: false }), 20, pond);
  const pondPoints = Array.from({ length: ripples.count }, (_, i) => {
    // Rejection sampling keeps rings inside the authored, stepped water surface.
    for (let attempt = 0; attempt < 100; attempt++) {
      const x = seed(i * 107 + attempt * 3) * 4.3 - 2.2;
      const z = seed(i * 109 + attempt * 3 + 1) * 3.8 - .4;
      if (isPondPoint(x, z, .22)) return { x, z };
    }
    return { x: 0, z: 1.5 };
  });

  function update(dt: number, reducedMotion: boolean, opacity: number, islandOpacity: number, cameraRotation: THREE.Quaternion, night: number) {
    group.visible = opacity > .001;
    pond.visible = islandOpacity > .001 && opacity > .001;
    if (!group.visible) { wishAge = WISH_SECONDS; return; }
    const step = reducedMotion ? 0 : Math.min(Math.max(dt, 0), .05);
    time += step;
    wishAge = reducedMotion ? WISH_SECONDS : Math.min(WISH_SECONDS, wishAge + step);
    for (const mode of gardenMoods) {
      const goal = mood === mode ? 1 : 0;
      weights[mode] = reducedMotion ? goal : THREE.MathUtils.damp(weights[mode], goal, 6, step);
      if (Math.abs(weights[mode] - goal) < .001) weights[mode] = goal;
    }

    petals.visible = weights.breeze > .001;
    petals.material.opacity = opacity * weights.breeze;
    if (petals.visible) for (let i = 0; i < petals.count; i++) {
      const phase = seed(i + 90) * Math.PI * 2;
      const wind = time * (.16 + seed(i * 3 + 1) * .12);
      dummy.position.set(wrap(seed(i * 7 + 1) * 9 + wind, 9) - 4.5, wrap(seed(i * 9 + 7) * 6 - wind, 6) + .1, (seed(i * 13 + 4) - .5) * 7 + Math.sin(time * .4 + phase) * .3);
      dummy.rotation.set(time * .5 + phase, phase + time * .4, time * .25);
      dummy.scale.setScalar(1);
      dummy.updateMatrix(); petals.setMatrixAt(i, dummy.matrix);
    }
    petals.instanceMatrix.needsUpdate = petals.visible;

    rain.visible = weights.rain > .001;
    rain.material.opacity = opacity * weights.rain * .55;
    if (rain.visible) for (let i = 0; i < rain.count; i++) {
      const height = wrap(seed(i * 3 + 17) * 9 - time * (4 + seed(i + 23) * 2), 9);
      dummy.position.set((seed(i * 7 + 1) - .5) * 10 + height * .09, height - .15, (seed(i * 13 + 4) - .5) * 8);
      dummy.rotation.set(0, 0, -.09); dummy.scale.setScalar(1);
      dummy.updateMatrix(); rain.setMatrixAt(i, dummy.matrix);
    }
    rain.instanceMatrix.needsUpdate = rain.visible;
    ripples.visible = rain.visible;
    ripples.material.opacity = weights.rain * islandOpacity * .34;
    if (ripples.visible) pondPoints.forEach((point, i) => {
      const age = wrap(time * .72 + seed(i + 30), 1);
      dummy.position.set(point.x, WATER_LEVEL + .008, point.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(Math.sin(age * Math.PI) * .18 + .01);
      dummy.updateMatrix(); ripples.setMatrixAt(i, dummy.matrix);
    });
    ripples.instanceMatrix.needsUpdate = ripples.visible;

    fireflies.visible = weights.fireflies > .001;
    fireflies.material.opacity = weights.fireflies * opacity;
    if (fireflies.visible) for (let i = 0; i < fireflies.count; i++) {
      const phase = seed(i + 4) * Math.PI * 2;
      dummy.position.set((seed(i * 7 + 1) - .5) * 8 + Math.sin(time * .31 + phase) * .55, .45 + seed(i * 9 + 7) * 4 + Math.sin(time * .45 + phase) * .28, (seed(i * 13 + 4) - .5) * 6 + Math.cos(time * .27 + phase) * .45);
      dummy.quaternion.copy(cameraRotation);
      dummy.scale.setScalar(.17 + (.5 + Math.sin(time * 1.4 + phase) * .5) * .25);
      dummy.updateMatrix(); fireflies.setMatrixAt(i, dummy.matrix);
    }
    fireflies.instanceMatrix.needsUpdate = fireflies.visible;

    wishes.visible = wishAge < WISH_SECONDS;
    wishes.material.color.set(night > .5 ? '#ffe7a1' : '#c57598');
    wishes.material.blending = night > .5 ? THREE.AdditiveBlending : THREE.NormalBlending;
    wishes.material.opacity = opacity * Math.min(1, wishAge * 4) * Math.min(1, (WISH_SECONDS - wishAge) / 1.4);
    if (wishes.visible) for (let i = 0; i < wishes.count; i++) {
      const angle = i * 2.39996 + wishAge * .8;
      const radius = (.25 + seed(i + 50) * 1.5) * (1 + wishAge * .18);
      dummy.position.set(Math.cos(angle) * radius, .15 + wishAge * (.8 + seed(i + 20) * .6), 1.1 + Math.sin(angle) * radius * .65);
      dummy.quaternion.copy(cameraRotation);
      dummy.scale.setScalar(.22 + seed(i + 3) * .2);
      dummy.updateMatrix(); wishes.setMatrixAt(i, dummy.matrix);
    }
    wishes.instanceMatrix.needsUpdate = wishes.visible;
  }

  return { group, pond, update, setMood: (value: GardenMood) => { mood = value; }, makeWish: () => { wishAge = 0; } };
}
