import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { profileData } from '../../data/site';
import { BibleVerseHoverCard, BibleVersePreviewPanel } from './bible-verse-hover-card';

test('renders the Romans bio as an accessible verse preview trigger', () => {
  const verse = profileData.bibleVersePreview;
  assert.ok(verse);

  const markup = renderToStaticMarkup(
    <BibleVerseHoverCard verse={verse}>{verse.reference}</BibleVerseHoverCard>,
  );

  assert.match(markup, /data-verse-preview-trigger="true"/);
  assert.match(markup, /aria-label="Preview Bible verse Romans 12:16-21"/);
  assert.match(markup, />Romans 12:16-21</);
});

test('renders only the Romans passage inside a compact preview panel', () => {
  const verse = profileData.bibleVersePreview;
  assert.ok(verse);

  const markup = renderToStaticMarkup(<BibleVersePreviewPanel verse={verse} />);

  assert.match(markup, /data-verse-preview-panel="true"/);
  assert.match(markup, /data-verse-preview-text="true"/);
  assert.match(markup, /w-\[min\(14\.75rem,calc\(100vw-1rem\)\)\]/);
  assert.equal(markup.match(/data-verse-preview-verse=/g)?.length, 6);
  assert.doesNotMatch(markup, /Bible verse/);
  assert.doesNotMatch(markup, /Romans 12:16-21/);
  assert.doesNotMatch(markup, /KJV/);
  assert.doesNotMatch(markup, /A call to humility/);
  assert.match(markup, /max-h-\[var\(--radix-hover-card-content-available-height\)\]/);
  assert.match(markup, /overflow-y-auto/);
  assert.doesNotMatch(markup, /grid-cols/);
  assert.doesNotMatch(markup, /rounded-lg bg-bg\/35/);
  assert.match(markup, /Be of the same mind one toward another/);
  assert.match(markup, /Be not overcome of evil, but overcome evil with good/);
});
