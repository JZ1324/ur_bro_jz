import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { PGlite } from '@electric-sql/pglite';
import { createPostgresStores } from '../server/postgres/stores.ts';
import { createPostgresLimiter } from '../server/postgres/rateLimit.ts';
import { createGardenApi } from '../server/gardenApi.ts';
import { emptyPlant } from '../src/garden/plantings.ts';
import { importRows } from '../scripts/import-hosted-garden.mjs';
import { validateDatabaseTarget } from '../server/postgres/database.ts';

const schema = readFileSync(new URL('../server/postgres/schema.sql', import.meta.url), 'utf8');
const plant = (id, extra = {}) => ({ ...emptyPlant(), id, createdAt: 1, author: 'Garden Friend', note: 'A lovely day', ...extra });
const wrap = pg => ({
  query: async (text, params = []) => (await pg.query(text, params)).rows,
  transaction: action => pg.transaction(tx => action(wrap(tx))),
  close: () => pg.close(),
});

test('hosted PostgreSQL schema, stores and HTTP API', async t => {
  const pg = new PGlite();
  const db = wrap(pg);
  await pg.exec(schema);
  t.after(() => pg.close());
  const { store, accounts } = createPostgresStores(db);

  await t.test('tables are private and protected by RLS; schema is repeatable', async () => {
    await pg.exec(schema);
    const tables = await db.query("SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='garden_private' AND c.relkind='r'");
    assert.equal(tables.length, 11);
    assert.ok(tables.every(row => row.relrowsecurity));
    await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
    await pg.exec(schema);
    const [row] = await db.query("SELECT has_schema_privilege('anon','garden_private','USAGE') AS anon,has_table_privilege('authenticated','garden_private.garden_sessions','SELECT') AS auth");
    assert.equal(row.anon, false); assert.equal(row.auth, false);
  });
  await t.test('planting retry, ownership, moderation, weekly limit and Undo', async () => {
    const saved = await store.put(plant('hosted-first'), 'visitor-a');
    assert.ok(saved.createdAt > 1);
    assert.equal((await store.put(plant('hosted-first'), 'visitor-a')).createdAt, saved.createdAt);
    await assert.rejects(store.put(plant('hosted-first'), 'visitor-b', true), { status: 404 });
    await assert.rejects(store.put(plant('hosted-second'), 'visitor-a'), { status: 429 });
    await assert.rejects(store.put(plant('bad-note', { note: '<script>bad</script>' }), 'visitor-b'), { status: 400 });
    await store.remove('hosted-first', 'visitor-a');
    await assert.rejects(store.put(plant('hosted-first'), 'visitor-b'), { status: 404 });
    assert.equal((await store.put(plant('hosted-first'), 'visitor-a')).createdAt, saved.createdAt);
    const publicPage = await store.list('visitor-b');
    assert.equal(publicPage.plants[0].canEdit, false);
    assert.equal('owner' in publicPage.plants[0], false);
  });
  await t.test('pagination totals, bounds and category filters', async () => {
    for (let i = 0; i < 27; i++) await store.put(plant(`page-${i}`, { kind: i % 2 ? 'pear' : 'rose' }), `publisher-${i}`);
    const first = await store.list('reader');
    assert.equal(first.total, 28); assert.equal(first.plants.length, 24);
    const last = await store.list('reader', 'all', 999);
    assert.equal(last.page, 2); assert.equal(last.plants.length, 4);
    assert.equal((await store.list('reader', 'fruit')).count, 13);
    await assert.rejects(store.list('reader', 'invalid'), { status: 400 });
  });
  await t.test('claim transfers only cookie-owned plantings and cooldowns', async () => {
    await store.claimGuest('visitor-a', 'account:alpha', 'New Name');
    assert.equal((await store.owned('visitor-a')).length, 0);
    const owned = await store.owned('account:alpha');
    assert.equal(owned.length, 1); assert.equal(owned[0].author, 'New Name'); assert.equal(owned[0].accountLinked, true);
    await assert.rejects(store.put(plant('claim-cooldown'), 'account:alpha'), { status: 429 });
  });
  await t.test('catch retries are idempotent and conflicting requests fail', async () => {
    const request = { id: 'catch-event-123', source: 'case', habitat: 'reef' };
    const first = await accounts.catchFish('alpha', request);
    const retried = await accounts.catchFish('alpha', request);
    assert.equal(retried.fishId, first.fishId); assert.equal(retried.ocean.opened, 1);
    await assert.rejects(accounts.catchFish('alpha', { ...request, habitat: 'kelp' }), { status: 409 });
    const restored = createPostgresStores(db);
    assert.equal((await restored.accounts.ocean('alpha')).opened, 1);
  });
  await t.test('guest import can be credited once across accounts and preserves private plants', async () => {
    const collection = await accounts.ocean('alpha');
    const payload = { id: 'import-device-123', ocean: collection, plants: [plant('private-plant', { shared: false })] };
    await accounts.importGuest('beta', payload);
    await accounts.importGuest('beta', payload);
    await accounts.importGuest('gamma', payload);
    assert.equal((await accounts.ocean('beta')).opened, 1);
    assert.equal((await accounts.ocean('gamma')).opened, 0);
    assert.equal((await accounts.keepsakes('beta')).length, 1);
    assert.ok(!(await accounts.keepsakes('beta'))[0].shared);
  });
  await t.test('sessions and browser-bound OTP attempts use persisted state', async () => {
    await accounts.start('state-one', 'nonce-one', '#ocean', 'friend@example.test');
    await assert.rejects(accounts.pending('state-one', 'wrong'), { status: 401 });
    for (let i = 0; i < 8; i++) assert.equal((await accounts.pending('state-one', 'nonce-one')).email, 'friend@example.test');
    await assert.rejects(accounts.pending('state-one', 'nonce-one'), { status: 401 });
    assert.equal(await accounts.consume('state-one', 'nonce-one'), '#ocean');
    await assert.rejects(accounts.consume('state-one', 'nonce-one'), { status: 401 });
    await accounts.createSession('session-token', { id: 'beta', name: 'Garden Friend' });
    assert.equal((await accounts.session('session-token')).id, 'beta');
    await accounts.logout('session-token');
    assert.equal(await accounts.session('session-token'), null);
  });
  await t.test('rate limits are shared between independently created instances', async () => {
    const first = createPostgresLimiter(db), second = createPostgresLimiter(db);
    await first('limit-key', 1);
    await assert.rejects(second('limit-key', 1), { status: 429 });
  });
  await t.test('connection URI is restricted to the selected Supabase project', async () => {
    assert.doesNotThrow(() => validateDatabaseTarget('postgresql://postgres.uajpewjagduzdpwlynrv:placeholder@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres'));
    assert.throws(() => validateDatabaseTarget('postgresql://postgres.other:placeholder@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres'));
    assert.throws(() => validateDatabaseTarget('postgresql://postgres:placeholder@example.com/postgres'));
  });
  await t.test('SQLite import is repeatable, preserves ownership, and rolls back conflicts', async () => {
    const payload = { ...plant('migrated-plant'), shared: true, createdAt: 1234 };
    const data = { plantings: [{ sequence: 1000, id: payload.id, owner: 'migrated-owner', category: 'flowers', payload: JSON.stringify(payload), created_at: 1234 }] };
    await importRows(db, data);
    await importRows(db, data);
    assert.equal((await store.owned('migrated-owner'))[0].createdAt, 1234);
    const altered = { plantings: [{ ...data.plantings[0], id: 'new-row-rolled-back', sequence: 1001 }, { ...data.plantings[0], owner: 'attacker' }] };
    await assert.rejects(importRows(db, altered));
    assert.equal((await db.query("SELECT id FROM garden_private.plantings WHERE id='new-row-rolled-back'")).length, 0);
    const after = await store.put(plant('after-import'), 'new-owner');
    assert.equal(after.canEdit, true);
  });
  await t.test('HTTP sign-in, cookie ownership and fish save round trip', async () => {
    const api = createGardenApi(undefined, { stores: { store, accounts }, limiter: createPostgresLimiter(db), auth: {
      sendCode: async () => {}, verifyCode: async (_email, code) => {
        if (code !== '123456') throw new Error('Unexpected code');
        return { id: 'hosted-http-account', name: 'Garden Friend' };
      },
    } });
    const server = createServer(async (req, res) => {
      if (req.headers['x-test-preparsed']) { const parts=[]; for await (const part of req) parts.push(part); req.body=JSON.parse(Buffer.concat(parts).toString()); }
      if (req.headers['x-test-invalid-body']) Object.defineProperty(req,'body',{ get() { throw new SyntaxError('Invalid JSON'); } });
      void api.handle(req, res, () => { res.writeHead(404); res.end(); });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const cookies = new Map();
    const origin = `http://127.0.0.1:${server.address().port}`;
    async function request(path, body, method = body ? 'POST' : 'GET', extra = {}) {
      const res = await fetch(`${origin}/api/garden${path}`, { method, headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: [...cookies].map(([k,v]) => `${k}=${v}`).join('; '), ...extra }, ...(body ? { body: JSON.stringify(body) } : {}) });
      for (const value of res.headers.getSetCookie()) { const [name, token] = value.split(';')[0].split('='); if (token) cookies.set(name, token); else cookies.delete(name); }
      return { status: res.status, data: await res.json() };
    }
    assert.equal((await request('/account')).status, 200);
    assert.equal((await request('/plants', plant('http-plant'))).status, 201);
    const challenge = await request('/auth/start', { email: 'friend@example.test', destination: '#ocean' });
    assert.equal(challenge.status, 200);
    const signIn = await request('/auth/complete', { state: challenge.data.state, code: '123456' });
    assert.equal(signIn.status, 200); assert.equal(signIn.data.plants[0].accountLinked, true);
    assert.equal((await request('/account/catch', { id: 'http-catch-123', source: 'case', habitat: 'reef' }, 'POST', { 'X-Test-Preparsed': '1' })).data.ocean.opened, 1);
    assert.equal((await request('/account/catch', {}, 'POST', { 'X-Test-Invalid-Body': '1' })).status, 400);
    assert.equal((await request('/account')).data.ocean.opened, 1);
    assert.equal((await request('/plants', plant('cross-site'), 'POST', { Origin: 'https://other.example' })).status, 403);
  });
});
