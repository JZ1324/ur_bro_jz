import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { PhotoOrbitTransition } from './PhotoOrbitTransition';

test('keeps all five orbit photos visible on mobile', () => {
  const markup = renderToStaticMarkup(<PhotoOrbitTransition />);

  assert.equal(markup.match(/data-photo-orbit-slot=/g)?.length, 5);
  assert.doesNotMatch(markup, /hidden sm:block/);
});

test('writes a handwritten description on every postcard back', () => {
  const markup = renderToStaticMarkup(<PhotoOrbitTransition />);

  assert.equal(markup.match(/data-photo-note=/g)?.length, 5);
  assert.equal(markup.match(/>camp photo</g)?.length, 2);
  assert.match(markup, />bike ride to the beach</);
  assert.match(markup, />photo shoot</);
  assert.match(markup, />bike ride</);
  assert.match(markup, /font-\[Caveat\]/);
});
