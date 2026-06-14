import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { PhotoOrbitTransition } from './PhotoOrbitTransition';

test('keeps all five orbit photos visible on mobile', () => {
  const markup = renderToStaticMarkup(<PhotoOrbitTransition />);

  assert.equal(markup.match(/data-photo-orbit-slot=/g)?.length, 5);
  assert.doesNotMatch(markup, /hidden sm:block/);
});
