import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
import { validateBytes } from 'gltf-validator';

test('the shipped game asset contains valid, compact voxel prefabs at their authored scale', async () => {
  const bytes = new Uint8Array(readFileSync(new URL('../public/models/hidden-garden.glb', import.meta.url)));
  assert.ok(bytes.length < 100_000, 'small prefabs keep the hidden adventure quick to load');
  const result = await validateBytes(bytes);
  assert.equal(result.issues.numErrors, 0); assert.equal(result.issues.numWarnings, 0);
  await MeshoptDecoder.ready;
  const doc = await new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder }).readBinary(bytes);
  const nodes = doc.getRoot().listScenes()[0].listChildren();
  assert.deepEqual(nodes.map(node => node.getName()).sort(), ['blossom', 'cherry', 'lantern', 'mushroom', 'shrub', 'sprout', 'treehouse']);
  for (const node of nodes) {
    const { min, max } = getBounds(node);
    assert.ok([...min, ...max].every(Number.isFinite));
    assert.ok(max.every((value, i) => value > min[i]));
    if (node.getName() === 'sprout') {
      assert.ok(max[1] - min[1] > 1.2 && max[1] - min[1] < 1.4);
      assert.ok(Math.abs(min[1]) < .025, 'sprout origin is at its feet');
    }
  }
});
