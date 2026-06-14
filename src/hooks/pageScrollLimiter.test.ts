import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clampQueuedScrollTarget,
  normalizeWheelDelta,
  stepCappedScroll,
} from './pageScrollLimiter';

test('caps each rendered scroll step in both directions', () => {
  assert.equal(stepCappedScroll(100, 900, 24), 124);
  assert.equal(stepCappedScroll(900, 100, 24), 876);
});

test('does not overshoot a nearby target', () => {
  assert.equal(stepCappedScroll(100, 112, 24), 112);
});

test('caps how far a fast gesture can queue ahead of the viewport', () => {
  assert.equal(clampQueuedScrollTarget(500, 500, 5000, 4000, 800), 1300);
  assert.equal(clampQueuedScrollTarget(1300, 1300, -5000, 4000, 800), 500);
});

test('normalizes line and page wheel deltas into pixels', () => {
  assert.equal(normalizeWheelDelta(3, 1, 800), 48);
  assert.equal(normalizeWheelDelta(1, 2, 800), 800);
});
