import * as THREE from 'three';
import { createKoiSchool, WATER_LEVEL } from './koi.ts';

const palettes = [
  ['#fff3dc', '#d95939', '#f2dfbd'], ['#edba50', '#f9dc87', '#f1cc73'],
  ['#fff3e1', '#394443', '#e3d8bf'], ['#e9804b', '#fff1d5', '#f3c38a'],
  ['#fff1d8', '#b94639', '#e8ceb0'], ['#f8e4b6', '#df8240', '#f4d093'],
];

export function createKoiPond() {
  const school = createKoiSchool();
  const group = new THREE.Group();
  group.name = 'Living_koi_pond';
  const cube = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial({ color: '#c8c8c8', roughness: .64, metalness: .03 });
  const partsPerFish = 19;
  const bodies = new THREE.InstancedMesh(cube, material, school.fish.length * partsPerFish);
  bodies.name = 'Voxel_koi';
  bodies.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  bodies.frustumCulled = false;
  group.add(bodies);
  const transform = new THREE.Object3D();
  const color = new THREE.Color();
  const rippleGeometry = new THREE.RingGeometry(.94, 1, 40);
  const ripples = Array.from({ length: 6 }, () => {
    const mesh = new THREE.Mesh(rippleGeometry, new THREE.MeshBasicMaterial({ color: '#e8fff3', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = WATER_LEVEL + .016;
    mesh.renderOrder = 2;
    mesh.visible = false;
    group.add(mesh);
    return { mesh, age: 10 };
  });
  const foodMaterial = new THREE.MeshStandardMaterial({ color: '#e5bd72', roughness: .9 });
  const food = new THREE.InstancedMesh(cube, foodMaterial, 5);
  food.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  food.frustumCulled = false;
  food.visible = false;
  group.add(food);
  let rippleIndex = 0;
  let ambientTime = 2;
  let foodTime = 0;
  let foodX = 0, foodZ = 0;

  function ripple(x: number, z: number, delay = 0) {
    const item = ripples[rippleIndex++ % ripples.length];
    item.mesh.position.x = x; item.mesh.position.z = z;
    item.age = -delay;
  }

  function pose() {
    let instance = 0;
    school.fish.forEach((koi, index) => {
      const [base, marking, fin] = palettes[index];
      const swim = school.elapsed * (3.6 + koi.speed * 8) + koi.phase;
      const depth = -.365 + Math.sin(school.elapsed * .5 + koi.phase) * .018;
      const c = Math.cos(koi.heading), s = Math.sin(koi.heading);
      function part(x: number, y: number, z: number, w: number, h: number, d: number, shade: string, bend = 0) {
        transform.position.set(koi.x + (x * c + z * s) * koi.size, depth + y, koi.z + (z * c - x * s) * koi.size);
        transform.rotation.set(0, koi.heading + bend, 0);
        transform.scale.set(w * koi.size, h, d * koi.size);
        transform.updateMatrix();
        bodies.setMatrixAt(instance, transform.matrix);
        bodies.setColorAt(instance++, color.set(shade));
      }
      const tail = Math.sin(swim) * .047 + koi.turn * .022;
      const bend = Math.sin(swim - .7) * .026 + koi.turn * .011;
      part(0, 0, .22, .12, .075, .12, base);
      part(0, .006, .12, .185, .11, .13, base);
      part(0, .005, 0, .205, .12, .14, base);
      part(bend * .4, 0, -.115, .17, .10, .12, base, bend);
      part(bend, -.003, -.21, .11, .07, .10, base, bend * 2);
      part(tail, -.01, -.29, .055, .045, .09, base, tail * 4);
      part(-.01, .059, .12, .13, .012, .075, marking);
      part(.03, .068, -.015, .11, .012, .10, index === 2 ? '#d95939' : marking);
      part(bend - .02, .053, -.125, .10, .012, .065, marking, bend);
      part(-.013, .041, .225, .07, .012, .075, index === 4 ? marking : base);
      part(-.063, .025, .22, .023, .019, .025, '#293b36');
      part(.063, .025, .22, .023, .019, .025, '#293b36');
      part(-.13, -.007, .075, .105, .022, .11, fin, -.45 + Math.sin(swim * .7) * .18);
      part(.13, -.007, .075, .105, .022, .11, fin, .45 - Math.sin(swim * .7) * .18);
      part(-.08 + bend, -.015, -.16, .07, .017, .085, fin, -.35);
      part(.08 + bend, -.015, -.16, .07, .017, .085, fin, .35);
      part(bend * .2, .065, -.035, .023, .026, .14, fin, bend);
      part(tail - .052, -.012, -.355, .11, .025, .115, fin, -.5 + tail * 4);
      part(tail + .052, -.012, -.355, .11, .025, .115, fin, .5 + tail * 4);
    });
    bodies.instanceMatrix.needsUpdate = true;
    bodies.instanceColor!.needsUpdate = true;
  }

  pose();
  return {
    group,
    call(x: number, z: number, reducedMotion: boolean) {
      if (!school.call(x, z, reducedMotion)) return false;
      const target = school.target!;
      foodX = target.x; foodZ = target.z;
      foodTime = reducedMotion ? 0 : 4;
      if (!reducedMotion) { ripple(target.x, target.z); ripple(target.x, target.z, .4); }
      pose();
      return true;
    },
    update(dt: number, reducedMotion: boolean, opacity: number) {
      group.visible = opacity > .001;
      if (!group.visible) return;
      const transparent = opacity < 1;
      if (material.transparent !== transparent) { material.transparent = transparent; material.needsUpdate = true; }
      material.opacity = opacity;
      material.depthWrite = opacity > .55;
      foodMaterial.transparent = transparent;
      foodMaterial.opacity = opacity;
      if (!reducedMotion) {
        school.update(dt);
        ambientTime -= dt;
        if (ambientTime <= 0) {
          const fish = school.fish[Math.floor(school.elapsed / 3) % school.fish.length];
          ripple(fish.x, fish.z);
          ambientTime = 3.2;
        }
        pose();
      }
      for (const item of ripples) {
        item.age = reducedMotion ? 10 : item.age + dt;
        const phase = item.age / 2.6;
        item.mesh.visible = phase >= 0 && phase < 1;
        if (!item.mesh.visible) continue;
        item.mesh.scale.setScalar(.035 + phase * .30);
        item.mesh.material.opacity = Math.sin(phase * Math.PI) * .42 * opacity;
      }
      foodTime = reducedMotion ? 0 : Math.max(0, foodTime - dt);
      food.visible = foodTime > 0;
      if (food.visible) {
        for (let i = 0; i < 5; i++) {
          const angle = i * 2.4;
          const radius = .045 + i * .022;
          transform.position.set(foodX + Math.sin(angle) * radius, WATER_LEVEL + .017, foodZ + Math.cos(angle) * radius);
          transform.rotation.set(0, angle, 0);
          transform.scale.setScalar(.026 * Math.min(1, foodTime));
          transform.updateMatrix();
          food.setMatrixAt(i, transform.matrix);
        }
        food.instanceMatrix.needsUpdate = true;
      }
    },
  };
}
