import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { readPlantings, savePlantings, type GardenPlant } from '../garden/plantings';
import { readCollection, saveCollection, type OceanCollection } from '../ocean/collection';
import { getFish } from '../ocean/catalog';
import { readSaved, save } from '../garden/storage';
import { AccountError, accountRequest, setExpectedAccount, readEmailChallenge, saveEmailChallenge, type EmailChallenge, type AccountSnapshot, type CatchInput, type GardenUser } from './api';

import { remainingGuestCollection, validGuestImport, type GuestImport } from './guestImport';
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Please try again.';
let bootstrap: Promise<AccountSnapshot> | undefined;
async function bringGuestCollection(snapshot: AccountSnapshot) {
  if (!snapshot.user) return snapshot;
  let batch = readSaved<GuestImport | null>('account:guest-import', null, validGuestImport);
  if (!batch) {
    const ocean = readCollection(), plants = readPlantings();
    if (!plants.length && !Object.keys(ocean.fish).length) return snapshot;
    batch = { id: crypto.randomUUID(), ocean, plants };
    // Keep the same import ID across interrupted requests and reloads.
    if (!save('account:guest-import', batch)) throw new Error('Allow browser storage to bring your guest collection into your account. Your guest items are still safe on this page.');
  }
  const imported = await accountRequest<AccountSnapshot>('/account/import', batch, 'POST', snapshot.user.id);
  const remaining = remainingGuestCollection(batch, readCollection(), readPlantings());
  const fishSaved = saveCollection(remaining.ocean);
  const plantsSaved = savePlantings(remaining.plants);
  if (fishSaved && plantsSaved) save('account:guest-import', null);
  return imported;
}
async function initialAccount() {
  return bringGuestCollection(await accountRequest<AccountSnapshot>('/account'));
}

type AccountContextValue = {
  user: GardenUser | null; ready: boolean; busy: boolean; error: string; plants: GardenPlant[]; ocean: OceanCollection;
  signInOpen: boolean; challenge: EmailChallenge | null;
  startSignIn(): Promise<void>; closeSignIn(): void; sendCode(email: string, name: string): Promise<void>; verifyCode(code: string): Promise<void>;
  signOut(): Promise<void>; refresh(): Promise<void>;
  keepPlants(plants: GardenPlant[]): boolean;
  catchFish(input: CatchInput): Promise<{ ocean: OceanCollection; fishId: string }>;
};
const AccountContext = createContext<AccountContextValue | null>(null);
export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GardenUser | null>(null), [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [signInOpen, setSignInOpen] = useState(false), [challenge, setChallenge] = useState(readEmailChallenge);
  const [plants, setPlants] = useState(readPlantings), [ocean, setOcean] = useState(readCollection);
  const identity = useRef<GardenUser | null>(null), version = useRef(0), pending = useRef(false);
  const inMemoryCatch = useRef<(CatchInput & { id: string }) | null>(null);
  function apply(snapshot: AccountSnapshot) {
    setExpectedAccount(snapshot.user?.id ?? null);
    if (identity.current?.id !== snapshot.user?.id) inMemoryCatch.current = null;
    identity.current = snapshot.user;
    setUser(previous => previous?.id === snapshot.user?.id && previous?.name === snapshot.user?.name ? previous : snapshot.user);
    const nextPlants = snapshot.user ? snapshot.plants : [...readPlantings().filter(p => !p.shared), ...snapshot.plants];
    const nextOcean = snapshot.ocean ?? readCollection();
    setPlants(previous => JSON.stringify(previous) === JSON.stringify(nextPlants) ? previous : nextPlants);
    setOcean(previous => JSON.stringify(previous) === JSON.stringify(nextOcean) ? previous : nextOcean);
    setReady(true); setError('');
    if (snapshot.user) save(`account:${snapshot.user.id}`, { plants: nextPlants, ocean: nextOcean });
    else savePlantings(nextPlants);
  }
  useEffect(() => {
    let active = true;
    pending.current = true;
    bootstrap ??= initialAccount();
    bootstrap.then(snapshot => { if (active) apply(snapshot); }).catch(reason => { if (active) setError(errorMessage(reason)); }).finally(() => { if (active) pending.current = false; });
    return () => { active = false; };
  }, []);
  async function refresh() {
    if (pending.current) return;
    const request = ++version.current;
    try {
      const snapshot = await bringGuestCollection(await accountRequest<AccountSnapshot>('/account'));
      if (request === version.current && !pending.current) apply(snapshot);
    } catch (reason) { if (request === version.current) { setError(errorMessage(reason)); if (reason instanceof AccountError && reason.status === 401) setReady(false); } }
  }
  useEffect(() => {
    const update = () => { if (!document.hidden) void refresh(); };
    window.addEventListener('focus', update); window.addEventListener('online', update);
    const timer = window.setInterval(update, 30_000);
    return () => { window.removeEventListener('focus', update); window.removeEventListener('online', update); clearInterval(timer); };
  }, []);
  async function startSignIn() { setSignInOpen(true); }
  function closeSignIn() { setSignInOpen(false); }
  async function sendCode(email: string, name: string) {
    if (pending.current) return;
    pending.current = true; ++version.current; setBusy(true); setError('');
    try {
      const destination = /^#[a-z-]{1,40}$/.test(location.hash) ? location.hash : '#opening';
      const next = await accountRequest<EmailChallenge>('/auth/start', { email, name, destination });
      saveEmailChallenge(next); setChallenge(next);
    } catch (reason) { setError(errorMessage(reason)); }
    finally { pending.current = false; setBusy(false); }
  }
  async function verifyCode(code: string) {
    if (pending.current) return;
    if (!challenge || challenge.expiresAt <= Date.now()) { setError('Your code has expired. Request another code to sign in.'); return; }
    pending.current = true; ++version.current; setBusy(true); setError('');
    try {
      const snapshot = await accountRequest<AccountSnapshot>('/auth/complete', { state: challenge.state, code });
      apply(snapshot);
      saveEmailChallenge(null); setChallenge(null);
      apply(await bringGuestCollection(snapshot));
      setSignInOpen(false);
    } catch (reason) { setError(errorMessage(reason)); }
    finally { pending.current = false; setBusy(false); }
  }
  async function signOut() {
    if (pending.current) return;
    pending.current = true; ++version.current; setBusy(true); setError('');
    try {
      await accountRequest('/auth/logout', {});
      apply({ user: null, plants: readPlantings().filter(plant => plant.shared), ocean: null });
      apply(await accountRequest<AccountSnapshot>('/account'));
    }
    catch (reason) { setError(errorMessage(reason)); }
    finally { pending.current = false; setBusy(false); }
  }
  function keepPlants(next: GardenPlant[]) {
    ++version.current;
    setPlants(next);
    return identity.current ? save(`account:${identity.current.id}:plants`, next) : savePlantings(next);
  }
  async function catchFish(input: CatchInput) {
    const account = identity.current;
    if (!account || !ready || pending.current) throw new Error('Please wait for your account to finish connecting.');
    pending.current = true; ++version.current; setBusy(true); setError('');
    const key = `account:${account.id}:pending-catch`;
    const stored = readSaved<(CatchInput & { id: string }) | null>(key, null, (value): value is CatchInput & { id: string } => !!value && typeof value === 'object' && 'id' in value && 'source' in value);
    const action = stored ?? inMemoryCatch.current ?? { ...input, id: crypto.randomUUID() };
    inMemoryCatch.current = action; save(key, action);
    try {
      const result = await accountRequest<{ ocean: OceanCollection; fishId: string }>('/account/catch', action);
      if (!getFish(result.fishId)) throw new Error('This catch could not be read. Please try again.');
      save(key, null); inMemoryCatch.current = null;
      setOcean(result.ocean); save(`account:${account.id}:ocean`, result.ocean);
      return result;
    } catch (reason) {
      if (reason instanceof AccountError && [400, 409].includes(reason.status)) { save(key, null); inMemoryCatch.current = null; }
      if (reason instanceof AccountError && reason.status === 401) setReady(false);
      setError(errorMessage(reason)); throw reason;
    } finally { pending.current = false; setBusy(false); }
  }
  return <AccountContext.Provider value={{ user, ready, busy, error, plants, ocean, signInOpen, challenge, startSignIn, closeSignIn, sendCode, verifyCode, signOut, refresh, keepPlants, catchFish }}>{children}</AccountContext.Provider>;
}
export function useGardenAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error('Garden account provider is missing.');
  return value;
}
