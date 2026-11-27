import type { GardenPlant } from '../garden/plantings';
import type { OceanCollection } from '../ocean/collection';
import type { Habitat } from '../ocean/catalog';

export type GardenUser = { id: string; name: string };
export type AccountSnapshot = { user: GardenUser | null; plants: GardenPlant[]; ocean: OceanCollection | null; destination?: string };
export type CatchInput = { source: 'case'; habitat: Habitat } | { source: 'shop'; tide: number; index: number };
export class AccountError extends Error {
  constructor(message: string, public status = 0) { super(message); }
}
let expectedAccount: string | undefined;
export const setExpectedAccount = (id: string | null) => { expectedAccount = id ?? 'guest'; };
export const accountHeaders = (): Record<string, string> => expectedAccount ? { 'X-Garden-Account': expectedAccount } : {};
export async function accountRequest<T>(path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST', scope?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/garden${path}`, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(scope ? { 'X-Garden-Account': scope } : accountHeaders()) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15_000) });
  } catch { throw new AccountError('Couldn’t reach the garden. Reconnect and try again; your saved collection is safe.'); }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new AccountError(data?.error ?? 'The garden could not save just now. Please try again.', response.status);
  return data;
}

export type EmailChallenge = { state: string; email: string; expiresAt: number };
export function readEmailChallenge(): EmailChallenge | null {
  try {
    const value = JSON.parse(sessionStorage.getItem('garden:email-challenge') ?? 'null');
    return value && /^[a-f0-9]{64}$/.test(value.state) && typeof value.email === 'string' && Number.isFinite(value.expiresAt) && value.expiresAt > Date.now() ? value : null;
  } catch { return null; }
}
export function saveEmailChallenge(value: EmailChallenge | null) {
  try { sessionStorage.setItem('garden:email-challenge', JSON.stringify(value)); } catch { /* The current page can still finish sign-in. */ }
}
