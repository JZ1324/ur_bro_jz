import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  PhotoOrbitTransition,
  photoEntryPoints,
  photoHoverSpring,
  photoOrbitVisualEnvelope,
  resolvePhotoHoverScale,
  resolvePhotoOrbitOffset,
  resolvePhotoOrbitPoint,
} from './PhotoOrbitTransition';

const orbitGeometry = [
  { angle: -158, depth: 0.55 },
  { angle: -88, depth: 0.82 },
  { angle: -18, depth: 1 },
  { angle: 54, depth: 0.72 },
  { angle: 126, depth: 0.64 },
] as const;

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

test('photo entry uses visible transform choreography without an animated blur', () => {
  const entry = orbitGeometry.map((slot, index) => (
    resolvePhotoOrbitPoint(slot.angle, 0, slot.depth, index)
  ));
  const settled = resolvePhotoOrbitPoint(-158, 0.28, 0.55, 0);

  assert.ok(entry.every((point) => point.scale === 0.82));
  assert.ok(entry.every((point) => point.opacity > 0.85));
  assert.deepEqual(entry.map((point) => point.entry), photoEntryPoints);
  assert.equal(settled.arrival, 1);
  assert.ok(settled.opacity > 0.8);
  assert.equal(Object.hasOwn(entry[0], 'blur'), false);
});

test('wide edge fan keeps cards separated during the first fifth of the chapter', () => {
  const viewports = [
    { width: 640, height: 570, cardWidth: 112 },
    { width: 359, height: 620, cardWidth: 82 },
  ];

  for (const viewport of viewports) {
    for (const progress of [0, 0.05, 0.1, 0.15, 0.2]) {
      const boxes = orbitGeometry.map((slot, index) => {
        const point = resolvePhotoOrbitPoint(slot.angle, progress, slot.depth, index);
        const offset = resolvePhotoOrbitOffset(point, viewport.width, viewport.height);
        return {
          x: offset.x,
          y: offset.y,
          width: viewport.cardWidth * point.scale,
          height: viewport.cardWidth * 1.25 * point.scale,
        };
      });

      boxes.forEach((box, index) => {
        boxes.slice(index + 1).forEach((other) => {
          const separatedX = Math.abs(box.x - other.x) >= (box.width + other.width) / 2;
          const separatedY = Math.abs(box.y - other.y) >= (box.height + other.height) / 2;
          assert.ok(separatedX || separatedY, `cards overlap at progress ${progress} in ${viewport.width}px orbit`);
        });
      });
    }
  }
});

test('keeps every hovered and rotated postcard inside desktop and mobile orbit bounds', () => {
  const viewports = [
    { width: 640, height: 570, cardWidth: 112 },
    { width: 359, height: 620, cardWidth: 82 },
    { width: 478, height: 406, cardWidth: 82 },
  ];

  for (const viewport of viewports) {
    for (const progress of [0, 0.05, 0.1, 0.2, 0.28, 0.5, 0.8, 1]) {
      orbitGeometry.forEach((slot, index) => {
        const point = resolvePhotoOrbitPoint(slot.angle, progress, slot.depth, index);
        const offset = resolvePhotoOrbitOffset(point, viewport.width, viewport.height);
        const halfDiagonal = Math.hypot(
          viewport.cardWidth * point.scale,
          viewport.cardWidth * 1.25 * point.scale,
        ) / 2 * photoOrbitVisualEnvelope.hoverScale * photoOrbitVisualEnvelope.maxParentScale;

        for (const parentRotate of [-photoOrbitVisualEnvelope.maxParentRotate, photoOrbitVisualEnvelope.maxParentRotate]) {
          const radians = parentRotate * Math.PI / 180;
          const centerX = (
            offset.x * Math.cos(radians) - offset.y * Math.sin(radians)
          ) * photoOrbitVisualEnvelope.maxParentScale;
          const centerY = (
            offset.x * Math.sin(radians) + offset.y * Math.cos(radians)
          ) * photoOrbitVisualEnvelope.maxParentScale;

          assert.ok(
            Math.abs(centerX) + halfDiagonal <= viewport.width / 2,
            `hovered photo ${index + 1} crosses the horizontal edge at progress ${progress} in ${viewport.width}px orbit`,
          );
          assert.ok(
            Math.abs(centerY) + halfDiagonal <= viewport.height / 2,
            `hovered photo ${index + 1} crosses the vertical edge at progress ${progress} in ${viewport.width}px orbit`,
          );
        }
      });
    }
  }
});

test('photo orbit allows the hover spring to paint beyond its resting layout box', () => {
  const markup = renderToStaticMarkup(<PhotoOrbitTransition />);
  const orbitTag = markup.match(/<div[^>]*data-photo-orbit="true"[^>]*>/)?.[0] ?? '';

  assert.match(orbitTag, /overflow-visible/);
  assert.doesNotMatch(orbitTag, /overflow-hidden/);
});

test('every photo keeps one shared scroll-driven size through the orbit', () => {
  for (const progress of [0, 0.14, 0.28, 0.5, 0.8, 1]) {
    const scales = orbitGeometry.map((slot, index) => (
      resolvePhotoOrbitPoint(slot.angle, progress, slot.depth, index).scale
    ));

    assert.ok(scales.every((scale) => Math.abs(scale - scales[0]) < 0.000001));
    assert.ok(Math.max(...scales) <= 0.94);
  }
});

test('hover scale is isolated, reversible, and uses the intended spring', () => {
  const markup = renderToStaticMarkup(<PhotoOrbitTransition />);

  assert.equal(markup.match(/data-photo-orbit-motion-layer=/g)?.length, 5);
  assert.equal(markup.match(/data-photo-orbit-interaction-layer=/g)?.length, 5);
  assert.equal(markup.match(/data-photo-orbit-flip-layer=/g)?.length, 5);
  assert.equal(resolvePhotoHoverScale(true), 1.08);
  assert.equal(resolvePhotoHoverScale(false), 1);
  assert.deepEqual(photoHoverSpring, { type: 'spring', stiffness: 360, damping: 24 });
});

test('photo orbit mapping is deterministic in reverse', () => {
  const values = [0, 0.12, 0.36, 0.62, 0.84, 1];
  const forward = new Map(values.map((value) => [value, resolvePhotoOrbitPoint(54, value, 0.72, 3)]));

  values.slice().reverse().forEach((value) => {
    assert.deepEqual(resolvePhotoOrbitPoint(54, value, 0.72, 3), forward.get(value));
  });
});
