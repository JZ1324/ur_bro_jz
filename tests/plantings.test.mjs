import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyPlant, finishPlant, MAX_PLANTS, parsePlantings, plantCatalog, readPlantings, savePlantings, upsertPlant } from '../src/garden/plantings.ts';
import { plantVoxels } from '../src/garden/plantModels.ts';
import { defaultFlowerDesign, isFlowerDesign } from '../src/garden/flowerDesign.ts';

function assertGrounded(voxels, label) {
  const remaining = new Set(voxels.map((_, i) => i));
  const touching = (a, b) => ['x', 'y', 'z'].every((axis, i) => Math.abs(a[axis] - b[axis]) <= (a[['w', 'h', 'd'][i]] + b[['w', 'h', 'd'][i]]) / 2 + 1e-6);
  while (remaining.size) {
    const queue = [remaining.values().next().value]; remaining.delete(queue[0]);
    for (let k = 0; k < queue.length; k++) for (const i of remaining) if (touching(voxels[queue[k]], voxels[i])) { remaining.delete(i); queue.push(i); }
    assert.ok(queue.some(i => voxels[i].y - voxels[i].h / 2 <= 1e-6), `${label} has floating blocks at ${JSON.stringify(voxels[queue[0]])}`);
  }
}

function storage(values = {}) {
  const data = new Map(Object.entries(values));
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  } });
  return () => { if (previous) Object.defineProperty(globalThis, 'localStorage', previous); else delete globalThis.localStorage; };
}

test('old flower counts migrate without losing plantings or resurrecting removed flowers', () => {
  const restore = storage({ 'garden:flowers': '3' });
  try {
    const migrated = readPlantings();
    assert.equal(migrated.length, 3);
    assert.equal(new Set(migrated.map(p => p.id)).size, 3);
    assert.ok(migrated.every(p => p.kind === 'daisy' && p.palette === 'blush'));
    assert.equal(savePlantings(migrated), true);
    assert.deepEqual(readPlantings(), migrated);
    savePlantings([]);
    assert.deepEqual(readPlantings(), [], 'an intentionally empty patch wins over the old counter');
  } finally { restore(); }
});

test('custom colours and handwritten Unicode notes survive save, reload, and editing', () => {
  const restore = storage();
  try {
    const original = finishPlant({ ...emptyPlant(), kind: 'strawberry', palette: 'custom', colors: { main: '#B677CB', leaves: '#457A61' }, note: '  Grow gently.\nLove, 花 🌷  ', author: '  JZ  ' });
    savePlantings([original]);
    assert.deepEqual(readPlantings(), [original]);
    assert.equal(original.note, 'Grow gently.\nLove, 花 🌷');
    const edited = finishPlant({ ...original, kind: 'lemon', note: 'A brighter tomorrow.' }, original);
    assert.equal(edited.id, original.id); assert.equal(edited.createdAt, original.createdAt);
    const next = upsertPlant(readPlantings(), edited);
    assert.equal(next.length, 1); assert.equal(next[0].note, 'A brighter tomorrow.');
    savePlantings(next); assert.deepEqual(readPlantings(), next);
  } finally { restore(); }
});

test('invalid saved entries are ignored and personal keepsakes keep growing past a single patch', () => {
  const plant = { ...emptyPlant(), id: 'safe', createdAt: 1 };
  const parsed = parsePlantings({ version: 1, plants: [plant, { ...plant }, { ...plant, id: 'bad-colour', colors: { main: 'url(https://example.com)', leaves: '#123456' } }, { ...plant, id: 'bad-note', note: 'x'.repeat(161) }, null] });
  assert.deepEqual(parsed, [plant]);
  assert.deepEqual(parsePlantings({ version: 2, plants: [plant] }), []);
  const full = Array.from({ length: MAX_PLANTS }, (_, i) => ({ ...plant, id: `plant-${i}` }));
  assert.equal(upsertPlant(full, plant).length, MAX_PLANTS + 1);
  assert.equal(parsePlantings({ version: 1, plants: upsertPlant(full, plant) }).length, MAX_PLANTS + 1);
  const edited = upsertPlant(full, { ...full[4], note: 'Still room for a thought.' });
  assert.equal(edited.length, MAX_PLANTS); assert.equal(edited[4].note, 'Still room for a thought.');
  assert.equal(full[4].note, '', 'editing leaves the previous state intact');
});

test('all 49 choices have distinct, compact 3D voxel shapes and accept custom colours', () => {
  assert.equal(plantCatalog.length, 49);
  assert.equal(new Set(plantCatalog.map(plant => plant.kind)).size, 49);
  for (const category of ['flowers', 'plants', 'fruit']) assert.equal(plantCatalog.filter(plant => plant.category === category).length, category === 'flowers' ? 17 : 16);
  const shapes = plantCatalog.map(plant => {
    const voxels = plantVoxels(plant.kind, { main: '#123456', leaves: '#abcdef' });
    assert.ok(voxels.length >= 7 && voxels.length < 100, `${plant.kind} has compact geometry`);
    assert.ok(voxels.some(voxel => voxel.color === '#123456'), `${plant.kind} supports custom colour`);
    for (const voxel of voxels) {
      assert.ok([voxel.x, voxel.y, voxel.z, voxel.w, voxel.h, voxel.d].every(Number.isFinite));
      assert.ok(voxel.w > 0 && voxel.h > 0 && voxel.d > 0);
      assert.ok(Math.abs(voxel.x) + voxel.w / 2 < 1 && Math.abs(voxel.z) + voxel.d / 2 < 1 && voxel.y + voxel.h / 2 < 1.6);
    }
    return JSON.stringify(voxels.map(({ color: _color, ...shape }) => shape));
  });
  assert.equal(new Set(shapes).size, plantCatalog.length);
});

test('every flower bloom, petal and leaf connects back to a grounded stem or base', () => {
  for (const plant of plantCatalog.filter(item => item.category === 'flowers')) assertGrounded(plantVoxels(plant.kind, plant.colors), plant.kind);
});

test('custom flower shapes stay connected and compact across all petal counts and extreme controls', () => {
  const colors = { main: '#123456', leaves: '#abcdef' };
  for (const shape of ['round', 'star', 'cup']) for (let petals = 4; petals <= 12; petals++) {
    for (const size of [.75, 1.2]) for (const stemHeight of [.45, 1.05]) for (const leafPairs of [0, 3]) {
      const design = { ...defaultFlowerDesign(), shape, petals, size, stemHeight, leafPairs };
      const voxels = plantVoxels('custom-flower', colors, design);
      assertGrounded(voxels, JSON.stringify(design));
      assert.ok(voxels.length < 100);
      assert.ok(voxels.every(v => Math.abs(v.x) + v.w / 2 < 1 && Math.abs(v.z) + v.d / 2 < 1 && v.y + v.h / 2 < 1.6));
    }
  }
});

test('a designed flower keeps its shape and colours after saving, reloading and editing', () => {
  const restore = storage();
  try {
    const design = { shape: 'star', petals: 10, size: 1.15, stemHeight: 1, leafPairs: 3, center: '#EAC579' };
    const original = finishPlant({ ...emptyPlant(), kind: 'custom-flower', design, author: 'Garden friend' });
    savePlantings([original]);
    assert.deepEqual(readPlantings()[0].design, design);
    assert.deepEqual(plantVoxels('custom-flower', original.colors, readPlantings()[0].design), plantVoxels('custom-flower', original.colors, design));
    const edited = finishPlant({ ...original, design: { ...original.design, shape: 'cup', petals: 6 } }, original);
    savePlantings(upsertPlant(readPlantings(), edited));
    assert.equal(readPlantings()[0].design.shape, 'cup');
    assert.equal(readPlantings()[0].design.petals, 6);
    assert.equal(edited.id, original.id);
    design.petals = 4;
    assert.equal(original.design.petals, 10, 'finishing copies the design');
    assert.equal('design' in finishPlant({ ...edited, kind: 'rose' }, edited), false, 'ready-made flowers do not keep a custom recipe');
  } finally { restore(); }
});

test('invalid flower designs are rejected without losing valid or legacy plantings', () => {
  const good = finishPlant({ ...emptyPlant(), kind: 'custom-flower', design: defaultFlowerDesign() });
  const invalid = [undefined, null, { ...good.design, shape: 'unknown' }, { ...good.design, petals: 3 }, { ...good.design, petals: 12.5 }, { ...good.design, size: 2 }, { ...good.design, stemHeight: NaN }, { ...good.design, leafPairs: -1 }, { ...good.design, leafPairs: 2.5 }, { ...good.design, center: 'red' }];
  for (const design of invalid) {
    assert.equal(isFlowerDesign(design), false);
    assert.deepEqual(parsePlantings({ version: 1, plants: [{ ...good, design }, { ...emptyPlant(), id: 'legacy', createdAt: 1 }] }).map(plant => plant.id), ['legacy']);
  }
});

test('legacy private notes do not become shared merely by loading or editing a draft', () => {
  const old = { ...emptyPlant(), id: 'old-private', createdAt: 1, note: 'For my own little garden.' };
  assert.equal(parsePlantings({ version: 1, plants: [old] })[0].shared, undefined);
  assert.equal(finishPlant({ ...old, author: 'A friend' }, old).shared, undefined);
  const shared = { ...old, shared: true, author: 'A friend' };
  assert.equal(parsePlantings({ version: 1, plants: [shared] })[0].shared, true);
});

test('unavailable device storage keeps the garden usable and reports an unsaved result', () => {
  const restore = storage();
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new DOMException('Storage unavailable', 'SecurityError'); } });
    assert.deepEqual(readPlantings(), []);
    assert.equal(savePlantings([{ ...emptyPlant(), id: 'visit-only', createdAt: 1 }]), false);
  } finally { restore(); }
});
