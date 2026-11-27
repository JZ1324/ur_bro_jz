import { GardenError } from './gardenRules.ts';
import { validateServerPlantText } from './moderation.ts';

export type GardenAccount = { id: string; name: string };
const url = process.env.GARDEN_SUPABASE_URL ?? 'https://uajpewjagduzdpwlynrv.supabase.co';
const key = process.env.GARDEN_PUBLISHABLE_KEY ?? 'sb_publishable_fVTy0h4wY0tl1DvT7bZT6g_TWMxiL6E';
const unavailable = () => new GardenError(503, 'The garden’s sign-in service is unavailable just now. Your guest collection is safe; please try again later.');

export function validEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
async function authRequest(path: string, body: unknown) {
  let response: Response;
  try {
    response = await fetch(`${url}/auth/v1/${path}`, { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(12_000) });
  } catch { throw unavailable(); }
  const data = await response.json().catch(() => null);
  if (response.status >= 500 || !data) throw unavailable();
  if (!response.ok) {
    if (response.status === 429) throw new GardenError(429, 'Please wait a minute before requesting another code.');
    if ((data.error_code ?? data.code) === 'email_address_not_authorized') throw new GardenError(503, 'Email delivery for new garden accounts needs to be configured. You can keep visiting as a guest.');
    throw new GardenError(401, path === 'verify' ? 'That code is incorrect or has expired. Check your email or request another code.' : 'We couldn’t send a sign-in code. Check your email address and try again.');
  }
  return data;
}
export async function sendGardenCode(email: string, name: string) {
  const candidate = name.trim().slice(0, 32);
  const displayName = candidate && validateServerPlantText(candidate, '').ok ? candidate : 'Garden friend';
  await authRequest('otp', { email, create_user: true, data: { display_name: displayName } });
}
export async function verifyGardenCode(email: string, code: string): Promise<GardenAccount> {
  const result = await authRequest('verify', { email, token: code, type: 'email' });
  const user = result.user;
  if (!user || typeof user.id !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(user.id)
    || !user.email_confirmed_at || user.email?.toLowerCase() !== email.toLowerCase()) throw new GardenError(401, 'The garden could not verify this account.');
  // Editable metadata is only a public name. Ownership uses the verified UID,
  // scoped to this Supabase project so identities from other projects cannot mix.
  const candidate = typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name.trim().slice(0, 32) : '';
  const name = candidate && validateServerPlantText(candidate, '').ok ? candidate : 'Garden friend';
  return { id: `${new URL(url).hostname}:${user.id}`, name };
}
