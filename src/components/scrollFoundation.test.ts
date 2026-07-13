import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

test('homepage uses native scrolling without wheel or touch interception', () => {
  assert.doesNotMatch(appSource, /useCappedPageScroll|requestCappedPageScroll/);
  assert.doesNotMatch(appSource, /preventDefault\(\).*wheel|addEventListener\(['"]wheel/);
  assert.match(cssSource, /scrollbar-width:\s*none/);
  assert.match(cssSource, /html::\-webkit-scrollbar[\s\S]*display:\s*none/);
  assert.match(cssSource, /scroll-behavior:\s*smooth/);
});

test('reduced motion removes sticky chapter expansion and smooth scrolling', () => {
  assert.match(cssSource, /prefers-reduced-motion:\s*reduce/);
  assert.match(cssSource, /\.scroll-chapter\s*\{\s*height:\s*auto/);
  assert.match(cssSource, /\.scroll-chapter-sticky\s*\{\s*position:\s*relative/);
  assert.match(cssSource, /scroll-behavior:\s*auto/);
});
