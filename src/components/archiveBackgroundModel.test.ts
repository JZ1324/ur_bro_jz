import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getArchiveBackgroundAssets,
  getBackgroundLayerPolicy,
  resolveBackgroundState,
} from './archiveBackgroundModel';

test('maps the page journey into deterministic background phases', () => {
  assert.equal(resolveBackgroundState(0).phase, 'profile');
  assert.equal(resolveBackgroundState(0.3).phase, 'archive');
  assert.equal(resolveBackgroundState(0.6).phase, 'clearing');
  assert.equal(resolveBackgroundState(0.9).phase, 'meadow');
});

test('clamps invalid progress and calculates local phase progress', () => {
  assert.deepEqual(resolveBackgroundState(-1), {
    progress: 0,
    phase: 'profile',
    phaseProgress: 0,
  });
  assert.deepEqual(resolveBackgroundState(2), {
    progress: 1,
    phase: 'meadow',
    phaseProgress: 1,
  });
});

test('phase mapping is symmetric when values are visited in reverse order', () => {
  const values = [0.08, 0.24, 0.51, 0.77, 0.94];
  const forward = new Map(values.map((value) => [value, resolveBackgroundState(value)]));

  values.slice().reverse().forEach((value) => {
    assert.deepEqual(resolveBackgroundState(value), forward.get(value));
  });
});

test('selects matching day and evening landscape pairs', () => {
  assert.deepEqual(getArchiveBackgroundAssets('day'), {
    distant: '/garden-pixel/landscape-quiet-day-distant.png',
    middle: '/garden-pixel/landscape-day-midground.png',
    foreground: '/garden-pixel/landscape-quiet-day-foreground.png',
  });
  assert.deepEqual(getArchiveBackgroundAssets('evening'), {
    distant: '/garden-pixel/landscape-quiet-evening-distant.png',
    middle: '/garden-pixel/landscape-evening-midground.png',
    foreground: '/garden-pixel/landscape-quiet-evening-foreground.png',
  });
});

test('reduced motion retains a static three-plane world', () => {
  assert.deepEqual(getBackgroundLayerPolicy(false, true), {
    distant: true,
    middle: true,
    foreground: true,
    canopy: false,
    light: false,
    animated: false,
  });
});

test('adaptive performance removes canopy decoration but keeps the core camera world', () => {
  assert.deepEqual(getBackgroundLayerPolicy(true, false), {
    distant: true,
    middle: true,
    foreground: true,
    canopy: false,
    light: false,
    animated: true,
  });
  assert.deepEqual(getBackgroundLayerPolicy(false, false), {
    distant: true,
    middle: true,
    foreground: true,
    canopy: true,
    light: true,
    animated: true,
  });
});
