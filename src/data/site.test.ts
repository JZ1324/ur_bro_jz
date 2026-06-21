import assert from 'node:assert/strict';
import test from 'node:test';
import { profileData } from './site';

test('profile Bible bio has Romans 12:16-21 preview content', () => {
  const profileWithPreview = profileData as typeof profileData & {
    bibleVersePreview?: {
      reference: string;
      translation: string;
      verses: Array<{ verse: string; text: string }>;
    };
  };

  assert.equal(profileWithPreview.bio, 'Romans 12:16-21');
  assert.ok(profileWithPreview.bibleVersePreview);
  assert.equal(profileWithPreview.bibleVersePreview.reference, 'Romans 12:16-21');
  assert.equal(profileWithPreview.bibleVersePreview.translation, 'KJV');
  assert.match(profileWithPreview.bibleVersePreview.verses[0].text, /Be of the same mind/);
  assert.match(profileWithPreview.bibleVersePreview.verses.at(-1)?.text ?? '', /overcome evil with good/);
});
