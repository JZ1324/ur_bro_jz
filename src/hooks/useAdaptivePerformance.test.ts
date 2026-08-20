import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advancePerformanceTracker,
  classifyFrameWindow,
  initialPerformanceTrackerState,
} from './useAdaptivePerformance';

test('classifies sustained 30fps pacing as slow', () => {
  assert.equal(classifyFrameWindow(Array.from({ length: 60 }, () => 33.3)), 'slow');
});

test('classifies stable 60fps pacing as healthy', () => {
  assert.equal(classifyFrameWindow(Array.from({ length: 120 }, () => 16.7)), 'healthy');
});

test('ignores short or inconclusive frame windows', () => {
  assert.equal(classifyFrameWindow(Array.from({ length: 12 }, () => 40)), 'neutral');
  assert.equal(classifyFrameWindow(Array.from({ length: 80 }, (_, index) => index % 4 === 0 ? 27 : 19)), 'neutral');
});

test('requires sustained slow pacing before reducing effects', () => {
  const first = advancePerformanceTracker(initialPerformanceTrackerState, 'slow');
  const second = advancePerformanceTracker(first, 'slow');
  assert.equal(first.mode, 'full');
  assert.equal(second.mode, 'reduced');
});

test('restores full effects only after four healthy windows', () => {
  let state = advancePerformanceTracker(
    advancePerformanceTracker(initialPerformanceTrackerState, 'slow'),
    'slow',
  );
  for (let index = 0; index < 3; index += 1) {
    state = advancePerformanceTracker(state, 'healthy');
    assert.equal(state.mode, 'reduced');
  }
  state = advancePerformanceTracker(state, 'healthy');
  assert.equal(state.mode, 'full');
});
