import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clampProgress,
  getChapterHeight,
  getVineContinuationSegments,
  getVineDrawProgress,
  getVineLandingProgress,
  getVineSegments,
  mapChapterProgress,
} from './scrollJourney';

test('chapter progress clamps and reverses deterministically', () => {
  assert.equal(mapChapterProgress(-1, 0.2, 0.8), 0);
  assert.equal(mapChapterProgress(1.4, 0.2, 0.8), 1);
  assert.ok(Math.abs(mapChapterProgress(0.5, 0.2, 0.8) - 0.5) < 0.000001);
  assert.equal(mapChapterProgress(0.32, 0.2, 0.8), mapChapterProgress(0.32, 0.2, 0.8));
  assert.equal(clampProgress(0.72), 0.72);
});

test('mobile vine remains on the left edge', () => {
  const mobileSegments = getVineSegments(true);
  const xValues = mobileSegments.flatMap((segment) => [
    segment.start.x,
    segment.controlA.x,
    segment.controlB.x,
    segment.end.x,
  ]);
  assert.ok(xValues.every((x) => x <= 22));
  assert.ok(Math.max(...xValues) - Math.min(...xValues) >= 15);
  assert.ok(getVineSegments(false).some((segment) => segment.end.x > 50));
});

test('vine continuation stays joined and bounded while reaching the final rose', () => {
  const start = { x: 39, y: 776 };
  const end = { x: 332, y: 379 };
  const segments = getVineContinuationSegments(start, end, 390, 844, true);

  assert.equal(segments.length, 1);
  assert.deepEqual(segments[0].start, start);
  assert.deepEqual(segments[0].end, end);
  assert.ok(segments.flatMap((segment) => [segment.start, segment.controlA, segment.controlB, segment.end])
    .every((point) => point.x >= 0 && point.x <= 390 && point.y >= 0 && point.y <= 844));

  const desktopSegments = getVineContinuationSegments(
    { x: 1246, y: 756 },
    { x: 1222, y: 807 },
    1440,
    900,
    false,
  );
  assert.equal(desktopSegments.length, 1);
  assert.deepEqual(desktopSegments[0].end, { x: 1222, y: 807 });
  assert.ok(desktopSegments.flatMap((segment) => [segment.start, segment.controlA, segment.controlB, segment.end])
    .every((point) => point.x >= 0 && point.x <= 1440 && point.y >= 0 && point.y <= 900));
  assert.ok(Math.min(...desktopSegments.flatMap((segment) => [segment.start.x, segment.controlA.x, segment.controlB.x, segment.end.x])) > 900);
});

test('final vine waits for the rose to enter the lower meadow', () => {
  assert.equal(getVineLandingProgress(400, 900), 0);
  assert.equal(getVineLandingProgress(612, 900), 0);
  assert.ok(Math.abs(getVineLandingProgress(693, 900) - 0.5) < 0.000001);
  assert.ok(Math.abs(getVineLandingProgress(774, 900) - 1) < 0.000001);
});

test('vine growth hands off continuously at the bottom of the journey', () => {
  const beforeLanding = getVineDrawProgress(0.94, 0);
  assert.ok(beforeLanding.mainGrowth < 1);
  assert.equal(beforeLanding.continuationGrowth, 0);

  const duringLanding = getVineDrawProgress(0.975, 0.42);
  assert.equal(duringLanding.mainGrowth, 1);
  assert.ok(Math.abs(duringLanding.continuationGrowth - 0.5) < 0.000001);

  assert.deepEqual(getVineDrawProgress(1, 1), { mainGrowth: 1, continuationGrowth: 1 });
});

test('reduced motion collapses cinematic chapter height', () => {
  assert.equal(getChapterHeight(200, 150, false, false), '200vh');
  assert.equal(getChapterHeight(200, 150, true, false), '150vh');
  assert.equal(getChapterHeight(200, 150, false, true), 'auto');
});
