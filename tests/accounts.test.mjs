import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { createGardenApi } from '../server/gardenApi.ts';
import { digest, openAccountStore } from '../server/accountStore.ts';
import { GardenError, openGardenStore } from '../server/gardenStore.ts';
import { emptyPlant } from '../src/garden/plantings.ts';
import { emptyCollection } from '../src/ocean/collection.ts';
import { fishCatalog, shopAt } from '../src/ocean/catalog.ts';

const users = { alpha: { id: '00000000-0000-4000-8000-000000000001', name: 'Alice' }, beta: { id: '00000000-0000-4000-8000-000000000002', name: 'Ben' } };
const plant = (id, author = 'Guest name') => ({ ...emptyPlant(), id, author, createdAt: 1 });
async function server(t) {
  const api = createGardenApi(':memory:', { publicUrl: 'http://127.0.0.1:3017', auth: {
    sendCode: async () => {},
    verifyCode: async (email, code) => {
      const user = users[email.split('@')[0]];
      if (!user || code !== '123456') throw new GardenError(401, 'Invalid sign-in code');
      return user;
    },
  } });
  const http = createServer((req, res) => void api.handle(req, res, () => { res.writeHead(404); res.end(); }));
  await new Promise(resolve => http.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(resolve => http.close(resolve)); api.close(); });
  const origin = `http://127.0.0.1:${http.address().port}`;
  const client = () => {
    const cookies = new Map();
    return { cookies, async request(path, body, method = body === undefined ? 'GET' : 'POST', headers = {}) {
      const response = await fetch(`${origin}/api/garden${path}`, { method, headers: { 'Content-Type': 'application/json', Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; '), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      for (const value of response.headers.getSetCookie()) { const [name, token] = value.split(';')[0].split('='); if (token) cookies.set(name, token); else cookies.delete(name); }
      return { status: response.status, data: await response.json(), headers: response.headers };
    } };
  };
  return { client };
}
async function signIn(client, user = 'alpha', extra = {}) {
  const start = await client.request('/auth/start', { email: `${user}@example.test`, destination: '#ocean' });
  assert.equal(start.status, 200);
  const state = start.data.state;
  const complete = await client.request('/auth/complete', { state, code: '123456', ...extra });
  assert.equal(complete.status, 200);
  return { ...complete, state };
}

test('sign-in requires browser-bound state, verifies identity, and rejects replay and cross-site starts', async t => {
  const { client } = await server(t), a = client(), attacker = client();
  const start = await a.request('/auth/start', { email: 'alpha@example.test', destination: '#ocean' });
  const state = start.data.state;
  assert.equal((await attacker.request('/auth/complete', { state, code: '123456' })).status, 401);
  const complete = await a.request('/auth/complete', { state, code: '123456', email: 'beta@example.test', userId: users.beta.id });
  assert.equal(complete.data.user.id, users.alpha.id);
  assert.equal(complete.data.destination, '#ocean');
  assert.match(complete.headers.get('set-cookie'), /HttpOnly/);
  assert.equal(JSON.stringify(complete.data).includes('token'), false);
  assert.equal((await a.request('/auth/complete', { state, code: '123456' })).status, 401);
  assert.equal((await attacker.request('/auth/start', {}, 'POST', { Origin: 'https://evil.example' })).status, 403);
});

test('sign-in claims only this browser’s plantings, uses the verified name, and retains ownership across devices', async t => {
  const { client } = await server(t), a = client(), b = client(), anotherDevice = client();
  await a.request('/plants', plant('alice-flower'));
  await b.request('/plants', plant('unrelated-flower'));
  await signIn(a);
  const home = await a.request('/account');
  assert.equal(home.data.plants.length, 1);
  assert.equal(home.data.plants[0].author, 'Alice');
  assert.equal(home.data.plants[0].accountLinked, true);
  const edited = await a.request('/plants/alice-flower', { ...plant('alice-flower', 'Impersonation'), owner: users.beta.id }, 'PUT');
  assert.equal(edited.data.plant.author, 'Alice');
  await signIn(anotherDevice);
  assert.equal((await anotherDevice.request('/account')).data.plants[0].id, 'alice-flower');
  assert.equal((await anotherDevice.request('/plants/unrelated-flower', plant('unrelated-flower'), 'PUT')).status, 404);
  assert.equal((await anotherDevice.request('/plants', plant('weekly-limit'))).status, 429);
  await a.request('/auth/logout', {});
  const guest = await a.request('/plants');
  assert.equal(guest.data.plants.find(p => p.id === 'alice-flower').canEdit, false);
  assert.equal((await a.request('/plants/alice-flower', plant('alice-flower'), 'PUT')).status, 404);
});

test('account catches persist across devices, concurrent catches add up, and a lost response can be retried once', async t => {
  const { client } = await server(t), a = client(), b = client();
  await signIn(a); await signIn(b);
  const action = { id: 'retry-catch-0001', source: 'case', habitat: 'reef' };
  const first = await a.request('/account/catch', action);
  const repeat = await a.request('/account/catch', action);
  assert.equal(first.status, 200); assert.deepEqual(repeat.data, first.data);
  const results = await Promise.all([a.request('/account/catch', { ...action, id: 'parallel-catch-a' }), b.request('/account/catch', { ...action, id: 'parallel-catch-b' })]);
  assert.ok(results.every(r => r.status === 200));
  const snapshot = await b.request('/account');
  assert.equal(Object.values(snapshot.data.ocean.fish).reduce((sum, n) => sum + n, 0), 3);
  assert.equal(snapshot.data.ocean.opened, 3);
  assert.equal((await a.request('/account/catch', { ...action, habitat: 'deep' })).status, 409);
  const stranger = client(); await signIn(stranger, 'beta');
  assert.deepEqual((await stranger.request('/account')).data.ocean, emptyCollection());
});

test('the live shop enforces one visitor per account per tide and refuses expired offers', async t => {
  const { client } = await server(t), a = client(); await signIn(a);
  const offer = shopAt(Date.now())[0], action = { source: 'shop', index: offer.index, tide: offer.tide, id: 'shop-event-0001' };
  assert.equal((await a.request('/account/catch', action)).status, 200);
  assert.equal((await a.request('/account/catch', { ...action, id: 'shop-event-0002' })).status, 409);
  assert.equal((await a.request('/account/catch', { ...action, id: 'shop-event-0003', tide: offer.tide - 1 })).status, 409);
});

test('guest import is idempotent across accounts and private keepsakes remain private', async t => {
  const { client } = await server(t), a = client(), b = client(); await signIn(a);
  const ocean = { ...emptyCollection(), fish: { [fishCatalog[0].id]: 2 }, opened: 2, lastCatch: fishCatalog[0].id };
  const batch = { id: 'guest-import-0001', ocean, plants: [plant('private-keepsake', '')] };
  assert.equal((await a.request('/account/import', batch)).status, 200);
  assert.equal((await a.request('/account/import', batch)).data.ocean.opened, 2);
  assert.equal((await a.request('/plants')).data.total, 0);
  assert.equal((await a.request('/account')).data.plants[0].id, 'private-keepsake');
  await a.request('/account/keepsakes/private-keepsake', undefined, 'DELETE');
  assert.equal((await a.request('/account')).data.plants.length, 0);
  const restored = await a.request('/account/keepsakes', plant('private-keepsake', ''));
  assert.equal(restored.data.plant.shared, undefined);
  assert.equal((await a.request('/plants')).data.total, 0);
  await signIn(b, 'beta');
  assert.equal((await b.request('/account/import', batch)).data.ocean.opened, 0);
  assert.equal((await b.request('/account')).data.plants.length, 0);
});

test('logout invalidates a session and stale account tabs cannot save into another account', async t => {
  const { client } = await server(t), a = client(); await signIn(a);
  const token = a.cookies.get('garden_account');
  const stale = client(); stale.cookies.set('garden_account', token);
  await a.request('/auth/logout', {});
  assert.equal((await stale.request('/plants', plant('expired-account-flower'))).status, 401);
  assert.equal((await stale.request('/account/catch', { id: 'stale-catch-event', source: 'case', habitat: 'reef' })).status, 401);
  await signIn(a, 'beta');
  assert.equal((await a.request('/account/catch', { id: 'wrong-tab-event', source: 'case', habitat: 'reef' }, 'POST', { 'X-Garden-Account': users.alpha.id })).status, 409);
  assert.equal((await a.request('/plants', plant('wrong-tab-flower'), 'POST', { 'X-Garden-Account': users.alpha.id })).status, 409);
});

test('account collections survive a server restart and expired sign-in states cannot be consumed', () => {
  const directory = mkdtempSync(join(tmpdir(), 'garden-account-')), path = join(directory, 'garden.sqlite');
  let store = openAccountStore(path);
  try {
    store.createSession('session', users.alpha);
    store.catchFish(users.alpha.id, { id: 'durable-catch-event', source: 'case', habitat: 'reef' });
    store.start('state', 'nonce', '#ocean');
    store.close(); store = openAccountStore(path);
    assert.deepEqual(store.session('session'), users.alpha);
    assert.equal(store.ocean(users.alpha.id).opened, 1);
    const db = new DatabaseSync(path); db.prepare('UPDATE garden_auth_flows SET expires=0 WHERE state=?').run(digest('state')); db.close();
    assert.throws(() => store.consume('state', 'nonce'), { status: 401 });
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('claiming removed plantings preserves Undo and the original weekly cooldown', () => {
  const store = openGardenStore(':memory:');
  try {
    store.put(plant('removed-guest-flower'), 'guest'); store.remove('removed-guest-flower', 'guest');
    store.claimGuest('guest', 'account:alice', 'Alice');
    assert.equal(store.put(plant('removed-guest-flower'), 'account:alice').canEdit, true);
    assert.throws(() => store.put(plant('extra-weekly-flower'), 'account:alice'), { status: 429 });
  } finally { store.close(); }
});

test('wrong email codes can be retried but a challenge stops after eight guesses', async t => {
  const { client } = await server(t), a = client();
  const start = await a.request('/auth/start', { email: 'alpha@example.test' });
  assert.equal('url' in start.data, false, 'sign-in stays inside the garden');
  for (let i = 0; i < 8; i++) assert.equal((await a.request('/auth/complete', { state: start.data.state, code: '654321' })).status, 401);
  assert.equal((await a.request('/auth/complete', { state: start.data.state, code: '123456' })).status, 401);
  await signIn(a);
  assert.equal((await a.request('/account')).data.user.id, users.alpha.id);
});
