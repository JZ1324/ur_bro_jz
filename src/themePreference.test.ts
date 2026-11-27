import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveInitialTheme } from './themePreference';

test('defaults first-time visitors to light mode', () => {
  assert.equal(resolveInitialTheme(null), 'light');
});

test('restores a saved light or dark preference', () => {
  assert.equal(resolveInitialTheme('light'), 'light');
  assert.equal(resolveInitialTheme('dark'), 'dark');
});

test('falls back to light mode for an invalid saved value', () => {
  assert.equal(resolveInitialTheme('unexpected'), 'light');
});

test('merges the prototype theme without overriding an existing archive preference', () => {
  assert.equal(resolveInitialTheme(null, 'dusk'), 'dark');
  assert.equal(resolveInitialTheme(null, 'day'), 'light');
  assert.equal(resolveInitialTheme('light', 'dusk'), 'light');
  assert.equal(resolveInitialTheme('dark', 'day'), 'dark');
  assert.equal(resolveInitialTheme(null, { time: 'dusk' }), 'light');
});
