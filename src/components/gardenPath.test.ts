import assert from 'node:assert/strict';
import test from 'node:test';
import { pathLength, resamplePathByDistance } from './gardenPath';

test('resamplePathByDistance spaces points evenly across segment boundaries', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 10, y: 0 },
  ];

  const sampled = resamplePathByDistance(points, 2);
  const distances = sampled.slice(1).map((point, index) => (
    Math.hypot(point.x - sampled[index].x, point.y - sampled[index].y)
  ));

  assert.deepEqual(sampled[0], points[0]);
  assert.deepEqual(sampled.at(-1), points.at(-1));
  assert.ok(distances.slice(0, -1).every((distance) => Math.abs(distance - 2) < 0.001));
  assert.ok((distances.at(-1) ?? 0) <= 2);
  assert.equal(pathLength(sampled), 10);
});
