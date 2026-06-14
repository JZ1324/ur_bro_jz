import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveInitialTheme } from './themePreference';

test('defaults first-time visitors to dark mode', () => {
  assert.equal(resolveInitialTheme(null), 'dark');
});

test('restores a saved light or dark preference', () => {
  assert.equal(resolveInitialTheme('light'), 'light');
  assert.equal(resolveInitialTheme('dark'), 'dark');
});

test('falls back to dark mode for an invalid saved value', () => {
  assert.equal(resolveInitialTheme('unexpected'), 'dark');
});
