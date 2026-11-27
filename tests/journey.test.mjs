import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { journeyFrame, progressAtScroll, sectionFromHash, sectionIds, LAST_STAGE } from '../src/garden/journey.ts';
import { createMorph } from '../src/garden/createMorph.ts';

const manifest = JSON.parse(readFileSync(new URL('../public/models/journey-voxels.json', import.meta.url)));
const bytes = readFileSync(new URL('../public/models/journey-voxels.bin', import.meta.url));
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const digest = array => createHash('sha256').update(new Uint8Array(array.buffer, array.byteOffset, array.byteLength)).digest('hex');

test('all chapter transitions hold for two thirds, then reach the next object', () => {
  for (let i = 0; i < LAST_STAGE; i++) {
    for (const hold of [0, .25, .6, 2 / 3]) {
      const state = journeyFrame((i + hold) / LAST_STAGE);
      assert.equal(state.from, i);
      assert.ok(state.mix < 1e-12);
    }
    assert.ok(Math.abs(journeyFrame((i + 5 / 6) / LAST_STAGE).mix - .5) < 1e-12);
    assert.ok(journeyFrame((i + 1 - 1e-6) / LAST_STAGE).mix > .99999);
    assert.equal(journeyFrame((i + 1) / LAST_STAGE).from, i + 1);
  }
  assert.deepEqual([journeyFrame(0).section, journeyFrame(1).section], ['opening', 'contact']);
});

test('measured uneven sections and short final viewports remain navigable', () => {
  const anchors = [0, 900, 2100, 3000, 4200, 5000, 6300, 7200];
  anchors.forEach((y, i) => assert.equal(progressAtScroll(y, anchors), i / (anchors.length - 1)));
  assert.equal(progressAtScroll(1500, anchors), 1.5 / (anchors.length - 1));
  assert.equal(progressAtScroll(-120, anchors), 0);
  assert.equal(progressAtScroll(8000, anchors), 1);
  const shorter = [...anchors.slice(0, -1), 7110];
  assert.equal(progressAtScroll(7110, shorter), 1);
  assert.equal(progressAtScroll(6361.5, [0, 908.8, 1817.6, 2726.4, 3635.2, 4544, 5452.8, 6361.6]), 1);
  assert.equal(progressAtScroll(1817.5, [0, 908.8, 1817.6, 2726.4]), 2 / 3);
});

test('legacy links and unknown hashes resolve to actual chapters', () => {
  assert.equal(sectionFromHash('#story'), 'about');
  assert.equal(sectionFromHash('#leadership'), 'about');
  assert.equal(sectionFromHash('#joys'), 'memories');
  assert.equal(sectionFromHash('#moments'), 'memories');
  assert.equal(sectionFromHash('#top'), 'opening');
  assert.equal(sectionFromHash('#missing'), 'opening');
  assert.equal(sectionFromHash(''), 'opening');
  sectionIds.forEach(id => assert.equal(sectionFromHash(`#${id}`), id));
});

test('reduced motion always presents a complete object', () => {
  for (let step = 0; step <= 140; step++) assert.equal(journeyFrame(step / 140, true).mix, 0);
  assert.equal(journeyFrame(.999, true).from, LAST_STAGE - 1);
  assert.equal(journeyFrame(1, true).from, LAST_STAGE);
});

test('every actual voxel transform reverses exactly and freezes between scroll events', () => {
  const model = createMorph(manifest, buffer);
  try {
    for (let i = 0; i < LAST_STAGE; i++) {
      model.update(i / LAST_STAGE, false);
      const start = digest(model.mesh.instanceMatrix.array);
      model.update((i + .5) / LAST_STAGE, false);
      assert.equal(digest(model.mesh.instanceMatrix.array), start, `stage ${i} holds its object`);
      const midpoint = (i + 5 / 6) / LAST_STAGE;
      model.update(midpoint, false);
      const halfway = digest(model.mesh.instanceMatrix.array);
      const colors = digest(model.mesh.instanceColor.array);
      assert.notEqual(halfway, start);
      assert.equal(model.update(midpoint, false), false);
      model.update((i + 1) / LAST_STAGE, false);
      assert.notEqual(digest(model.mesh.instanceMatrix.array), halfway);
      model.update(midpoint, false);
      assert.equal(digest(model.mesh.instanceMatrix.array), halfway, `stage ${i} reverses exactly`);
      assert.equal(digest(model.mesh.instanceColor.array), colors);
      model.update(midpoint, true);
      assert.equal(digest(model.mesh.instanceMatrix.array), start, `stage ${i} respects reduced motion`);
    }
  } finally {
    model.mesh.dispose(); model.mesh.geometry.dispose(); model.mesh.material.dispose();
  }
});

test('incomplete or incompatible voxel assets fail cleanly', () => {
  assert.throws(() => createMorph({ ...manifest, version: 99 }, buffer), /Invalid/);
  assert.throws(() => createMorph(manifest, buffer.slice(0, -4)), /Invalid/);
  assert.throws(() => createMorph({ ...manifest, layouts: ['opening'] }, buffer), /Invalid/);
});
