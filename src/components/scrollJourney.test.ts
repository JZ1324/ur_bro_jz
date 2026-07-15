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
  mapMeadowSceneProgress,
  mapMeadowVisualProgress,
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

test('desktop vine reaches its landing without a bottom hook', () => {
  const segments = getVineSegments(false);
  const landing = segments[segments.length - 1];
  const minX = Math.min(landing.start.x, landing.end.x);
  const maxX = Math.max(landing.start.x, landing.end.x);
  const minY = Math.min(landing.start.y, landing.end.y);
  const maxY = Math.max(landing.start.y, landing.end.y);

  assert.ok([landing.controlA, landing.controlB].every((point) => (
    point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
  )));
  assert.equal(landing.controlB.x, landing.end.x);
  assert.ok(landing.controlB.y < landing.end.y);
  assert.ok(landing.controlA.x < landing.controlB.x);
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
  const desktopLanding = desktopSegments[0];
  assert.ok([desktopLanding.controlA, desktopLanding.controlB].every((point) => (
    point.x >= Math.min(desktopLanding.start.x, desktopLanding.end.x)
    && point.x <= Math.max(desktopLanding.start.x, desktopLanding.end.x)
    && point.y >= Math.min(desktopLanding.start.y, desktopLanding.end.y)
    && point.y <= Math.max(desktopLanding.start.y, desktopLanding.end.y)
  )));
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

test('meadow reveal reaches its composed state before the sticky chapter ends', () => {
  assert.equal(mapMeadowVisualProgress(0), 0);
  assert.ok(Math.abs(mapMeadowVisualProgress(0.41) - 0.5) < 0.000001);
  assert.equal(mapMeadowVisualProgress(0.82), 1);
  assert.equal(mapMeadowVisualProgress(1), 1);
  assert.equal(mapMeadowVisualProgress(0, true), 1);
});

test('shared camera introduces the meadow before local chapter growth takes over', () => {
  assert.equal(mapMeadowSceneProgress(0, 0.78), 0);
  assert.ok(Math.abs(mapMeadowSceneProgress(0, 0.81) - 0.38) < 0.000001);
  assert.equal(mapMeadowSceneProgress(0, 0.84), 0.76);
  assert.ok(mapMeadowSceneProgress(0.6, 0.81) > 0.7);
  assert.equal(mapMeadowSceneProgress(0, 0, true), 1);
});
