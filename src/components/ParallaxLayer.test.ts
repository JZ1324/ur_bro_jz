import assert from 'node:assert/strict';
import test from 'node:test';
import { getCalmContentKeyframes, getCinematicContentKeyframes } from './ParallaxLayer';

test('calm content holds a stable readable zone for the middle seventy percent', () => {
  const keyframes = getCalmContentKeyframes([0.2, 0.4]);
  assert.deepEqual(keyframes.input, [0.2, 0.23, 0.37, 0.4]);
  assert.deepEqual(keyframes.y, [14, 0, 0, -18]);
  assert.deepEqual(keyframes.opacity, [0.97, 1, 1, 0.98]);
});

test('calm content has no horizontal drift, rotation, or blur', () => {
  const keyframes = getCalmContentKeyframes([0.2, 0.4]);
  assert.ok(keyframes.x.every((value) => value === 0));
  assert.ok(keyframes.rotate.every((value) => value === 0));
  assert.ok(keyframes.blur.every((value) => value === 0));
});

test('calm mobile content travel stays within eight pixels', () => {
  const keyframes = getCalmContentKeyframes([0.2, 0.4], 4 / 9);
  assert.ok(keyframes.y.every((value) => Math.abs(value) <= 8));
  assert.equal(keyframes.y[keyframes.y.length - 1], -8);
});

test('cinematic content holds a readable middle fifty-five percent', () => {
  const keyframes = getCinematicContentKeyframes([0.2, 0.4]);

  assert.ok(keyframes.input.every((value, index) => (
    Math.abs(value - [0.2, 0.245, 0.355, 0.4][index]) < 0.000001
  )));
  assert.deepEqual(keyframes.y, [44, 0, 0, -56]);
  assert.deepEqual(keyframes.scale, [0.965, 1, 1, 0.975]);
  assert.deepEqual(keyframes.opacity, [0.84, 1, 1, 0.72]);
  assert.ok(Math.abs((keyframes.input[2] - keyframes.input[1]) / 0.2 - 0.55) < 0.000001);
});

test('cinematic mobile content uses fifty-five percent travel without text distortion', () => {
  const keyframes = getCinematicContentKeyframes([0.2, 0.4], 0.55);

  assert.deepEqual(keyframes.y, [24.200000000000003, 0, 0, -30.800000000000004]);
  assert.ok(keyframes.x.every((value) => value === 0));
  assert.ok(keyframes.rotate.every((value) => value === 0));
  assert.ok(keyframes.blur.every((value) => value === 0));
});
