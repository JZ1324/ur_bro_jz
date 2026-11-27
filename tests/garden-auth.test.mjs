import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sendGardenCode, verifyGardenCode, validEmail } from '../server/gardenAuth.ts';
const id = '00000000-0000-4000-8000-000000000001';
const email = 'alice@example.test';
const scopedId = `uajpewjagduzdpwlynrv.supabase.co:${id}`;
test('codes are sent through the selected About Me project with a safe display name', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://uajpewjagduzdpwlynrv.supabase.co/auth/v1/otp');
    assert.equal(options.headers.apikey, 'sb_publishable_fVTy0h4wY0tl1DvT7bZT6g_TWMxiL6E');
    assert.deepEqual(JSON.parse(options.body), { email, create_user: true, data: { display_name: 'Alice' } });
    return Response.json({});
  });
  await sendGardenCode(email, ' Alice ');
});
test('the code is verified only by About Me auth and editable metadata cannot replace identity', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://uajpewjagduzdpwlynrv.supabase.co/auth/v1/verify');
    assert.deepEqual(JSON.parse(options.body), { email, token: '123456', type: 'email' });
    return Response.json({ user: { id, email, email_confirmed_at: '2026-01-01', user_metadata: { display_name: ' Alice ', id: 'impersonation' } }, access_token: 'discarded-access', refresh_token: 'discarded-refresh' });
  });
  assert.deepEqual(await verifyGardenCode(email, '123456'), { id: scopedId, name: 'Alice' });
});
test('unverified, mismatched, and rejected codes cannot create a garden identity', async t => {
  const mocked = t.mock.method(globalThis, 'fetch', async () => Response.json({ user: { id, email } }));
  await assert.rejects(verifyGardenCode(email, '123456'), { status: 401 });
  mocked.mock.mockImplementation(async () => Response.json({ user: { id, email: 'another@example.test', email_confirmed_at: '2026-01-01' } }));
  await assert.rejects(verifyGardenCode(email, '123456'), { status: 401 });
  mocked.mock.mockImplementation(async () => Response.json({ message: 'Token expired' }, { status: 403 }));
  await assert.rejects(verifyGardenCode(email, '123456'), { status: 401 });
});
test('public names use a safe fallback without exposing an email address', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ user: { id, email, email_confirmed_at: '2026-01-01', user_metadata: {} } }));
  assert.deepEqual(await verifyGardenCode(email, '123456'), { id: scopedId, name: 'Garden friend' });
});
test('delivery restrictions and provider outages are actionable without creating an account', async t => {
  const mocked = t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('fetch failed'); });
  await assert.rejects(verifyGardenCode(email, '123456'), { status: 503 });
  mocked.mock.mockImplementation(async () => Response.json({ error_code: 'email_address_not_authorized' }, { status: 400 }));
  await assert.rejects(sendGardenCode(email, 'Alice'), { status: 503 });
  mocked.mock.mockImplementation(async () => Response.json({}, { status: 429 }));
  await assert.rejects(sendGardenCode(email, 'Alice'), { status: 429 });
});
test('invalid email input is rejected before sending a code', () => {
  for (const value of ['not-an-email', 'a@b', '', null, 'a'.repeat(255)+'@example.com']) assert.equal(validEmail(value), false);
  assert.equal(validEmail('hello@example.com'), true);
});
