import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { profileData, projects } from './site';

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

test('licensed audio uses the protected Supabase function for every quality', () => {
  const sources = profileData.track?.sources ?? [];

  assert.deepEqual(sources.map((source) => source.quality), ['high', 'medium', 'low']);
  for (const source of sources) {
    assert.match(source.src, /\/functions\/v1\/get-track-audio\?quality=(high|medium|low)$/);
    assert.doesNotMatch(source.src, /\/storage\/v1\/object\/public\//);
  }
});

test('audio edge function downloads from the private Storage endpoint', () => {
  const functionSource = readFileSync(
    new URL('../../supabase/functions/get-track-audio/index.ts', import.meta.url),
    'utf8',
  );

  assert.match(functionSource, /\/storage\/v1\/object\/authenticated\//);
});

test('recent live projects use their deployed websites', () => {
  const liveUrls = {
    'vce-vault': 'https://vce-vault.vercel.app/',
    gptdoc: 'https://gptdoc.vercel.app/',
    studyflow: 'https://studyflow-dusky-beta.vercel.app/',
    meta6: 'https://meta6-btd6-guide.vercel.app/',
    'studyflow-capture': 'https://studyflow-jz1324.vercel.app/',
    dripwriter: 'https://ur-bro-jz.vercel.app/projects/dripwriter/',
    decibal: 'https://ur-bro-jz.vercel.app/projects/decibal/',
    touchytap: 'https://ur-bro-jz.vercel.app/projects/touchytap/',
    deepworkclock: 'https://ur-bro-jz.vercel.app/projects/deepworkclock/',
    hidevault: 'https://ur-bro-jz.vercel.app/projects/hidevault/',
    spoof: 'https://ur-bro-jz.vercel.app/projects/spoof/',
    stuable: 'https://ur-bro-jz.vercel.app/projects/stuable/',
  } as const;

  for (const [id, url] of Object.entries(liveUrls)) {
    const project = projects.find((item) => item.id === id);
    assert.ok(project, `Expected project ${id} to exist`);
    assert.equal(project.link, url);
    assert.ok(project.tags.includes('Live'));
    assert.doesNotMatch(project.link, /github\.com/i);
  }
});

test('new project pages have matching static entrypoints', () => {
  const projectIds = [
    'dripwriter',
    'decibal',
    'touchytap',
    'deepworkclock',
    'hidevault',
    'spoof',
    'stuable',
  ];

  for (const id of projectIds) {
    const pageSource = readFileSync(new URL(`../../public/projects/${id}/index.html`, import.meta.url), 'utf8');
    assert.match(pageSource, new RegExp(`data-project="${id}"`));
  }
});

test('project archive ids remain unique', () => {
  const ids = projects.map((project) => project.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('current project shelf has three live featured builds', () => {
  const featuredProjects = projects.filter((project) => project.featured);

  assert.deepEqual(featuredProjects.map((project) => project.id), [
    'vce-vault',
    'gptdoc',
    'studyflow',
  ]);
  assert.ok(featuredProjects.every((project) => project.link && project.tags.includes('Live')));
});
