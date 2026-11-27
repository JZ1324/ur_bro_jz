import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createKoiSchool, isPondPoint, WATER_LEVEL } from '../src/garden/koi.ts';
import { createKoiPond } from '../src/garden/createKoiPond.ts';
import { Matrix4, Vector3 } from 'three';

test('koi stay within the stepped pond during wandering and repeated calls near banks', () => {
  const school = createKoiSchool();
  const targets = [[-2.2, 1.6], [.65, 3.15], [1.9, .1], [-.15, 1.5]];
  const visited = school.fish.map(() => new Set());
  for (let tick = 0; tick < 18000; tick++) {
    if (tick % 1800 === 0) school.call(...targets[(tick / 1800) % targets.length]);
    school.update(1 / 60);
    school.fish.forEach((fish, i) => {
      assert.ok(isPondPoint(fish.x, fish.z, .47), `fish ${i} left the pond at tick ${tick}`);
      assert.ok(Number.isFinite(fish.heading));
      visited[i].add(`${Math.round(fish.x * 4)},${Math.round(fish.z * 4)}`);
    });
  }
  visited.forEach(cells => assert.ok(cells.size > 15, 'fish should keep exploring instead of sticking to a bank'));
});

test('a water tap gathers the koi, expires, and ignores dry land or invalid input', () => {
  const school = createKoiSchool();
  const distance = () => school.fish.reduce((sum, fish) => sum + Math.hypot(fish.x - .55, fish.z - 2.15), 0) / school.fish.length;
  const before = distance();
  assert.equal(school.call(.55, 2.15), true);
  for (let i = 0; i < 480; i++) school.update(1 / 60);
  assert.ok(distance() < before * .5);
  assert.equal(school.call(4, 4), false);
  assert.equal(school.call(NaN, 2), false);
  assert.deepEqual(school.target, { x: .55, z: 2.15 });
  for (let i = 0; i < 90; i++) school.update(1 / 60);
  assert.equal(school.target, null);
});

test('fixed updates keep swimming consistent on 30, 60 and 120 Hz displays', () => {
  const states = [30, 60, 120].map(rate => {
    const school = createKoiSchool();
    school.call(.55, 2.15);
    for (let i = 0; i < rate * 10; i++) school.update(1 / rate);
    return school.fish;
  });
  assert.deepEqual(states[0], states[1]);
  assert.deepEqual(states[1], states[2]);
});

function disposePond(pond) {
  const geometry = new Set(), materials = new Set();
  pond.group.traverse(object => {
    if (object.isInstancedMesh) object.dispose();
    if (object.geometry) geometry.add(object.geometry);
    if (object.material) materials.add(object.material);
  });
  geometry.forEach(value => value.dispose());
  materials.forEach(value => value.dispose());
}
const digest = mesh => createHash('sha256').update(new Uint8Array(mesh.instanceMatrix.array.buffer)).digest('hex');

test('hidden ponds and reduced motion hold their pose, while explicit calls still respond', () => {
  const pond = createKoiPond();
  try {
    const bodies = pond.group.getObjectByName('Voxel_koi');
    const initial = digest(bodies);
    for (let i = 0; i < 100; i++) pond.update(1 / 60, false, 0);
    assert.equal(digest(bodies), initial);
    for (let i = 0; i < 100; i++) pond.update(1 / 60, true, 1);
    assert.equal(digest(bodies), initial);
    assert.equal(pond.call(.55, 2.15, true), true);
    const gathered = digest(bodies);
    assert.notEqual(gathered, initial);
    pond.update(1 / 60, true, 1);
    assert.equal(digest(bodies), gathered);
    assert.equal(pond.group.children.filter(child => child.visible).length, 1);
    pond.update(1 / 60, false, 1);
    assert.notEqual(digest(bodies), gathered);
    pond.update(1 / 60, false, .4);
    assert.equal(bodies.material.opacity, .4);
    pond.update(1 / 60, false, 1);
    assert.equal(bodies.material.transparent, false);
  } finally { disposePond(pond); }
});

test('the complete fish geometry fits between the pond bed and surface', () => {
  const pond = createKoiPond();
  try {
    const bodies = pond.group.getObjectByName('Voxel_koi');
    const vertices = bodies.geometry.getAttribute('position');
    const matrix = new Matrix4(), vertex = new Vector3();
    for (let frame = 0; frame < 1200; frame++) {
      if (frame === 600) pond.call(1.9, .1, false);
      pond.update(1 / 60, false, 1);
      if (frame % 60 !== 0) continue;
      for (let instance = 0; instance < bodies.count; instance++) {
        bodies.getMatrixAt(instance, matrix);
        for (let i = 0; i < vertices.count; i++) {
          vertex.fromBufferAttribute(vertices, i).applyMatrix4(matrix);
          assert.ok(vertex.y < WATER_LEVEL && vertex.y > -.49, 'body must stay underwater and above the bed');
          assert.ok(isPondPoint(vertex.x, vertex.z), 'tail and fins must not cross the shore');
        }
      }
    }
  } finally { disposePond(pond); }
});
