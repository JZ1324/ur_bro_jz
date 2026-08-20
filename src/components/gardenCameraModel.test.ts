import assert from 'node:assert/strict';
import test from 'node:test';
import {
  gardenDepthPresets,
  mapGardenJourneyProgress,
  resolveGardenCameraState,
  resolveGardenJourneyStops,
} from './gardenCameraModel';

test('maps the shared camera through the existing garden phases', () => {
  assert.equal(resolveGardenCameraState(0, 'desktop').phase, 'profile');
  assert.equal(resolveGardenCameraState(0.22, 'desktop').phase, 'archive');
  assert.equal(resolveGardenCameraState(0.49, 'desktop').phase, 'clearing');
  assert.equal(resolveGardenCameraState(0.78, 'desktop').phase, 'meadow');
});

test('clamps progress and follows the desktop lateral camera path', () => {
  assert.equal(resolveGardenCameraState(-2, 'desktop').progress, 0);
  assert.equal(resolveGardenCameraState(2, 'desktop').progress, 1);
  assert.equal(resolveGardenCameraState(0, 'desktop').cameraOffset.x, 0);
  assert.equal(resolveGardenCameraState(0.22, 'desktop').cameraOffset.x, -40);
  assert.equal(resolveGardenCameraState(0.49, 'desktop').cameraOffset.x, 28);
  assert.equal(resolveGardenCameraState(0.78, 'desktop').cameraOffset.x, -44);
  assert.equal(resolveGardenCameraState(1, 'desktop').cameraOffset.x, 0);
  assert.equal(resolveGardenCameraState(1, 'desktop').cameraOffset.y, -720);
});

test('mobile camera travel stays capped and lateral travel is forty-five percent strength', () => {
  const desktop = resolveGardenCameraState(0.22, 'desktop');
  const mobile = resolveGardenCameraState(0.22, 'mobile');
  const mobileEnd = resolveGardenCameraState(1, 'mobile');

  assert.equal(mobile.cameraOffset.x, desktop.cameraOffset.x * 0.45);
  assert.equal(mobileEnd.cameraOffset.y, -180);
  assert.ok(Math.abs(mobileEnd.cameraOffset.y * gardenDepthPresets.canopy) <= 153);
});

test('background planes stay inside their desktop travel limits and depth order', () => {
  const end = resolveGardenCameraState(1, 'desktop');
  assert.ok(Math.abs(end.cameraOffset.y * gardenDepthPresets.distant) <= 87);
  assert.ok(Math.abs(end.cameraOffset.y * gardenDepthPresets.middle) <= 245);
  assert.ok(Math.abs(end.cameraOffset.y * gardenDepthPresets.foreground) <= 447);
  assert.ok(Math.abs(end.cameraOffset.y * gardenDepthPresets.canopy) <= 612);

  assert.ok(gardenDepthPresets.sky < gardenDepthPresets.content);
  assert.ok(gardenDepthPresets.content < gardenDepthPresets.distant);
  assert.ok(gardenDepthPresets.distant < gardenDepthPresets.light);
  assert.ok(gardenDepthPresets.light < gardenDepthPresets.middle);
  assert.ok(gardenDepthPresets.middle < gardenDepthPresets.foreground);
  assert.ok(gardenDepthPresets.foreground < gardenDepthPresets.canopy);
});

test('camera zoom and roll hit the cinematic stops and return to neutral', () => {
  assert.deepEqual(
    [0, 0.22, 0.49, 0.78, 1].map((value) => resolveGardenCameraState(value, 'desktop').scale),
    [1, 1.06, 1.12, 1.08, 1],
  );
  assert.ok(
    [0, 0.22, 0.49, 0.78, 1]
      .map((value) => resolveGardenCameraState(value, 'desktop').roll)
      .every((value, index) => Math.abs(value - [0, -0.8, 0.6, -0.5, 0][index]) < 0.000001),
  );
});

test('camera mapping and meadow handoff are deterministic in reverse', () => {
  const values = [0.04, 0.22, 0.36, 0.49, 0.78, 0.83, 0.88, 0.97];
  const forward = new Map(values.map((value) => [value, resolveGardenCameraState(value, 'desktop')]));

  values.slice().reverse().forEach((value) => {
    assert.deepEqual(resolveGardenCameraState(value, 'desktop'), forward.get(value));
  });

  assert.equal(resolveGardenCameraState(0.78, 'desktop').meadowBlend, 0);
  assert.ok(Math.abs(resolveGardenCameraState(0.83, 'desktop').meadowBlend - 0.5) < 0.000001);
  assert.ok(Math.abs(resolveGardenCameraState(0.88, 'desktop').meadowBlend - 1) < 0.000001);
});

test('derives camera phase boundaries from semantic content anchors', () => {
  const stops = resolveGardenJourneyStops({
    totalScroll: 5000,
    viewportHeight: 1000,
    storiesTop: 1500,
    photosTop: 2600,
    meadowTop: 4300,
  });

  assert.deepEqual(stops, [0, 0.19, 0.544, 0.77, 1]);
  assert.equal(mapGardenJourneyProgress(stops[1], stops), 0.22);
  assert.equal(mapGardenJourneyProgress(stops[2], stops), 0.49);
  assert.equal(mapGardenJourneyProgress(stops[3], stops), 0.78);
});

test('anchor-driven camera progress stays monotonic and reverses exactly', () => {
  const stops = resolveGardenJourneyStops({
    totalScroll: 4200,
    viewportHeight: 844,
    storiesTop: 1200,
    photosTop: 2200,
    meadowTop: 3600,
  });
  const values = [0, 0.08, 0.21, 0.42, 0.68, 0.86, 1];
  const forward = values.map((value) => mapGardenJourneyProgress(value, stops));

  assert.ok(forward.every((value, index) => index === 0 || value >= forward[index - 1]));
  values.slice().reverse().forEach((value) => {
    const forwardIndex = values.indexOf(value);
    assert.equal(mapGardenJourneyProgress(value, stops), forward[forwardIndex]);
  });
});

test('crowded anchors retain a safe ordered timeline', () => {
  const stops = resolveGardenJourneyStops({
    totalScroll: 1000,
    viewportHeight: 900,
    storiesTop: 30,
    photosTop: 40,
    meadowTop: 50,
  });

  assert.ok(stops.every((value, index) => index === 0 || value > stops[index - 1]));
  assert.equal(stops[0], 0);
  assert.equal(stops[4], 1);
});
