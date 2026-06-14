import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveVineAttachments, connectedBloomTiming } from './gardenVineAttachments';

test('rose attachments resolve onto an actual sampled vine point', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 10, y: 4 },
    { x: 20, y: 8 },
    { x: 30, y: 12 },
  ];

  const attachment = resolveVineAttachments(points, [
    { id: 'rose', target: { x: 18, y: 7 } },
  ]).rose;

  assert.deepEqual({ x: attachment.x, y: attachment.y }, points[2]);
  assert.equal(attachment.growth, 2 / 3);
});

test('connected bloom timing never reveals a rose before its vine attachment', () => {
  const timing = connectedBloomTiming(0.6, [0.2, 0.3], [0.3, 0.5]);

  assert.equal(timing.grow[0], timing.connection);
  assert.ok(timing.grow[0] >= 0.6);
  assert.ok(timing.bloom[0] >= timing.grow[1]);
});
