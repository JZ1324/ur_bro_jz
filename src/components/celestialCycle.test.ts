import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceCelestialCycle } from './celestialCycle';

test('every rapid theme change advances to a new forward-only cycle', () => {
  const first = advanceCelestialCycle({ theme: 'evening', cycle: 0 }, 'day');
  const second = advanceCelestialCycle(first, 'evening');
  const third = advanceCelestialCycle(second, 'day');

  assert.deepEqual(first, { theme: 'day', cycle: 1 });
  assert.deepEqual(second, { theme: 'evening', cycle: 2 });
  assert.deepEqual(third, { theme: 'day', cycle: 3 });
});

test('rerendering the same theme keeps the current cycle identity', () => {
  assert.deepEqual(
    advanceCelestialCycle({ theme: 'day', cycle: 4 }, 'day'),
    { theme: 'day', cycle: 4 },
  );
});
