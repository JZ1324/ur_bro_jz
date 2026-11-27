import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { openGardenStore, PUBLISH_COOLDOWN_MS } from '../server/gardenStore.ts';
import { createGardenApi } from '../server/gardenApi.ts';
import { validatePlantText } from '../src/garden/moderation.ts';
import { emptyPlant, plantCatalog } from '../src/garden/plantings.ts';
import { defaultFlowerDesign } from '../src/garden/flowerDesign.ts';

const planting = (id, extra = {}) => ({ ...emptyPlant(), id, createdAt: 1, author: 'A friend', ...extra });

test('a published planting persists through a server restart and is visible to another visitor', () => {
  const dir = mkdtempSync(join(tmpdir(), 'garden-store-'));
  let store = openGardenStore(join(dir, 'garden.sqlite'));
  try {
    const saved = store.put(planting('hello', { author: '  Garden friend  ', note: '  A little love  ', kind: 'peach', palette: 'custom', colors: { main: '#cc88aa', leaves: '#779966' } }), 'visitor-a');
    assert.equal(saved.author, 'Garden friend'); assert.equal(saved.note, 'A little love'); assert.ok(saved.createdAt > 1);
    assert.equal(store.list('visitor-a').plants[0].canEdit, true);
    store.close(); store = openGardenStore(join(dir, 'garden.sqlite'));
    const publicPage = store.list('visitor-b');
    assert.equal(publicPage.total, 1); assert.equal(publicPage.plants[0].canEdit, false);
    assert.equal(publicPage.plants[0].colors.main, '#cc88aa');
    assert.equal('owner' in publicPage.plants[0], false);
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('the garden grows into further patches, with stable pagination and category totals', () => {
  const store = openGardenStore(':memory:');
  try {
    for (let i = 0; i < 53; i++) store.put(planting(`p-${i}`, { kind: i % 2 ? 'pear' : 'rose' }), `owner-${i}`);
    const first = store.list('reader'); const second = store.list('reader', 'all', 2); const last = store.list('reader', 'all', 99);
    assert.equal(first.total, 53); assert.equal(first.plants.length, 24); assert.equal(first.pages, 3);
    assert.equal(last.page, 3); assert.equal(last.plants.length, 5);
    assert.equal(new Set([...first.plants, ...second.plants, ...last.plants].map(p => p.id)).size, 53);
    const fruit = store.list('reader', 'fruit'); assert.equal(fruit.count, 26); assert.equal(fruit.total, 53);
    assert.ok(fruit.plants.every(p => p.kind === 'pear'));
    assert.throws(() => store.list('reader', 'bad-category'), { status: 400 });
  } finally { store.close(); }
});

test('every catalogue variety can be shared, restored, and browsed in its category', () => {
  const dir = mkdtempSync(join(tmpdir(), 'garden-catalogue-'));
  const database = join(dir, 'garden.sqlite');
  let store = openGardenStore(database);
  try {
    for (const item of plantCatalog) store.put(planting(`catalogue-${item.kind}`, { kind: item.kind, colors: item.colors, ...(item.kind === 'custom-flower' ? { design: defaultFlowerDesign() } : {}) }), `owner-${item.kind}`);
    store.close(); store = openGardenStore(database);
    assert.equal(store.list('reader').total, plantCatalog.length);
    for (const category of ['flowers', 'plants', 'fruit']) {
      const expected = plantCatalog.filter(item => item.category === category);
      const page = store.list('reader', category);
      assert.equal(page.count, expected.length);
      assert.deepEqual(new Set(page.plants.map(plant => plant.kind)), new Set(expected.map(item => item.kind)));
      assert.ok(page.plants.every(plant => !plant.canEdit));
    }
    const edited = store.put(planting('catalogue-orchid', { kind: 'dragonfruit', palette: 'custom', colors: { main: '#cc88aa', leaves: '#779966' } }), 'owner-orchid', true);
    assert.equal(edited.kind, 'dragonfruit');
    assert.equal(store.list('owner-orchid', 'fruit').plants.find(plant => plant.id === edited.id).canEdit, true);
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('shared custom flowers retain their recipe after restart and edits, and reject malformed designs', () => {
  const dir = mkdtempSync(join(tmpdir(), 'garden-custom-flower-'));
  const database = join(dir, 'garden.sqlite');
  let store = openGardenStore(database);
  try {
    const design = { ...defaultFlowerDesign(), shape: 'star', petals: 12, stemHeight: 1.05, leafPairs: 3, center: '#dcba75' };
    const original = planting('my-design', { kind: 'custom-flower', design: { ...design, extra: 'discard this' } });
    const saved = store.put(original, 'flower-owner');
    assert.deepEqual(saved.design, design, 'the server retains only the supported design fields');
    store.close(); store = openGardenStore(database);
    assert.deepEqual(store.list('another-visitor', 'flowers').plants[0].design, design);
    assert.throws(() => store.put({ ...saved, design: { ...design, petals: 5 } }, 'another-visitor', true), { status: 404 });
    const edited = store.put({ ...saved, design: { ...design, shape: 'cup', petals: 5 } }, 'flower-owner', true);
    assert.equal(edited.createdAt, saved.createdAt);
    assert.equal(store.list('flower-owner', 'flowers').plants[0].design.petals, 5);
    for (const malformed of [undefined, null, { ...design, petals: 5000 }, { ...design, shape: 'unknown' }, { ...design, center: 'url(example)' }]) {
      assert.throws(() => store.put(planting('invalid-design', { kind: 'custom-flower', design: malformed }), 'new-owner'), { status: 400 });
    }
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('only the planting owner can edit or remove it, and duplicate publish retries are idempotent', () => {
  const store = openGardenStore(':memory:');
  try {
    const first = store.put(planting('mine'), 'a');
    store.put(planting('mine'), 'a'); assert.equal(store.list('a').total, 1);
    assert.throws(() => store.put(planting('mine', { note: 'Changed' }), 'b', true), { status: 404 });
    assert.throws(() => store.put(planting('mine'), 'b'), { status: 404 });
    assert.throws(() => store.remove('mine', 'b'), { status: 404 });
    const edited = store.put(planting('mine', { kind: 'grapes', author: 'Still me', note: 'New note' }), 'a', true);
    assert.equal(edited.createdAt, first.createdAt); assert.equal(store.list('b', 'fruit').count, 1);
    store.remove('mine', 'a'); assert.equal(store.list('b').total, 0);
    assert.throws(() => store.put(planting('mine'), 'a', true), { status: 404 });
  } finally { store.close(); }
});

test('a visitor can add one shared planting per week, while edits and retries stay available', () => {
  const store = openGardenStore(':memory:');
  const originalNow = Date.now;
  try {
    const first = store.put(planting('weekly-first'), 'weekly-owner');
    assert.equal(store.put(planting('weekly-first'), 'weekly-owner').id, first.id);
    assert.throws(() => store.put(planting('weekly-second'), 'weekly-owner'), { status: 429 });
    assert.equal(store.put(planting('weekly-first', { note: 'A new note' }), 'weekly-owner', true).note, 'A new note');
    Date.now = () => originalNow() + PUBLISH_COOLDOWN_MS + 1;
    assert.equal(store.put(planting('weekly-second'), 'weekly-owner').id, 'weekly-second');
    store.remove('weekly-second', 'weekly-owner');
    assert.throws(() => store.put(planting('weekly-third'), 'weekly-owner'), { status: 429 });
  } finally { Date.now = originalNow; store.close(); }
});

test('Undo restores the same owned planting without bypassing the weekly limit', () => {
  const directory = mkdtempSync(join(tmpdir(), 'garden-undo-'));
  const path = join(directory, 'garden.sqlite');
  let store = openGardenStore(path);
  try {
    const first = store.put(planting('undo-me', { note: 'A little hello' }), 'owner');
    store.remove(first.id, 'owner');
    assert.equal(store.list('reader').total, 0);
    store.close(); store = openGardenStore(path);
    assert.throws(() => store.put(first, 'someone-else'), { status: 404 });
    const restored = store.put(first, 'owner');
    assert.equal(restored.createdAt, first.createdAt);
    assert.equal(restored.note, first.note);
    assert.equal(store.list('reader').total, 1);
    assert.equal(store.put(first, 'owner').id, first.id);
    assert.throws(() => store.put(planting('extra-slot'), 'owner'), { status: 429 });
    store.remove(first.id, 'owner');
    assert.throws(() => store.put(planting('extra-slot'), 'owner'), { status: 429 });
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('publishing requires a writer and rejects oversized or invalid input', () => {
  const store = openGardenStore(':memory:');
  try {
    for (const extra of [{ author: '' }, { author: '  ' }, { author: 'A\nB' }, { author: 'x'.repeat(33) }, { author: '花' }, { note: 'x'.repeat(161) }, { note: 'これは庭のメモです' }, { kind: 'alien' }, { colors: { main: 'red', leaves: '#aabbcc' } }]) {
      assert.throws(() => store.put(planting('invalid', extra), 'owner'), { status: 400 });
    }
    assert.equal(store.list('reader').total, 0);
    assert.equal(store.put(planting('valid', { note: '', author: 'Nickname' }), 'owner').note, '');
  } finally { store.close(); }
});

test('shared text moderation catches profanity variants and unsafe combinations', () => {
  const store = openGardenStore(':memory:');
  try {
    for (const [index, extra] of [
      { author: 'f.u.c.k' },
      { note: 'f 4 c k' },
      { author: 'Garden friend', note: 'Go die' },
      { author: 'Garden friend', note: 'Please visit https://example.com' },
      { author: 'Garden friend', note: 'Hola, esta es una nota para el jardin y sus flores.' },
    ].entries()) assert.throws(() => store.put(planting(`blocked-${index}`, extra), 'owner'), { status: 400 });
    const accepted = store.put(planting('accepted', { author: 'Garden friend', note: 'My tiny flower is growing' }), 'owner');
    assert.equal(accepted.note, 'My tiny flower is growing');
  } finally { store.close(); }
});

test('the browser gate gives immediate feedback for non-English or unsafe text', () => {
  assert.equal(validatePlantText('Garden friend', 'Hola, esta es una nota para el jardin.').ok, false);
  assert.equal(validatePlantText('Garden friend', 'A little love for the garden.').ok, true);
  assert.equal(validatePlantText('Garden friend', 'f.u.c.k').ok, false);
  assert.equal(validatePlantText('12345', 'A little love.').ok, false);
  assert.equal(validatePlantText('Garden friend', '12345').ok, false);
});

test('HTTP API shares notes across browsers while protecting edits and rejecting foreign-site writes', async () => {
  const api = createGardenApi(':memory:');
  const server = createServer((req, res) => { void api.handle(req, res, () => { res.writeHead(404); res.end(); }); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/garden/plants`;
  try {
    const visitA = await fetch(base), visitB = await fetch(base);
    const cookieA = visitA.headers.get('set-cookie').split(';')[0], cookieB = visitB.headers.get('set-cookie').split(';')[0];
    assert.match(visitA.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
    assert.notEqual(cookieA, cookieB);
    const payload = JSON.stringify(planting('http-plant', { kind: 'pineapple', note: 'Hello from browser A' }));
    const post = await fetch(base, { method: 'POST', headers: { Cookie: cookieA, 'Content-Type': 'application/json' }, body: payload });
    assert.equal(post.status, 201);
    const other = await (await fetch(base, { headers: { Cookie: cookieB } })).json();
    assert.equal(other.plants[0].note, 'Hello from browser A'); assert.equal(other.plants[0].canEdit, false);
    const forbidden = await fetch(`${base}/http-plant`, { method: 'DELETE', headers: { Cookie: cookieB } }); assert.equal(forbidden.status, 404);
    const crossSite = await fetch(base, { method: 'POST', headers: { Cookie: cookieA, Origin: 'https://elsewhere.example', 'Content-Type': 'application/json' }, body: payload }); assert.equal(crossSite.status, 403);
    const invalid = await fetch(base, { method: 'POST', headers: { Cookie: cookieA, 'Content-Type': 'application/json' }, body: 'broken' }); assert.equal(invalid.status, 400);
    const deleted = await fetch(`${base}/http-plant`, { method: 'DELETE', headers: { Cookie: cookieA } }); assert.equal(deleted.status, 200);
  } finally { await new Promise(resolve => server.close(resolve)); api.close(); }
});
