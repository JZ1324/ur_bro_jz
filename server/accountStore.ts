import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { GardenError } from './gardenStore.ts';
import type { GardenAccount } from './gardenAuth.ts';
import { addFish, claimOffer, emptyCollection, validCollection, type OceanCollection } from '../src/ocean/collection.ts';
import { cases, rollFish, shopAt, type Habitat } from '../src/ocean/catalog.ts';
import { parsePlantings } from '../src/garden/plantings.ts';

export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const validId = (id: unknown): id is string => typeof id === 'string' && /^[a-zA-Z0-9_-]{8,80}$/.test(id);
type CatchRequest = { id: string; source: 'case'; habitat: Habitat } | { id: string; source: 'shop'; tide: number; index: number };
export function openAccountStore(path: string) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS garden_accounts (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS garden_sessions (token TEXT PRIMARY KEY, account TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS garden_auth_flows (state TEXT PRIMARY KEY, nonce TEXT NOT NULL, destination TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS account_oceans (account TEXT PRIMARY KEY, payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS account_catches (account TEXT NOT NULL, event TEXT NOT NULL, request TEXT NOT NULL, fish TEXT NOT NULL, PRIMARY KEY(account, event));
    CREATE TABLE IF NOT EXISTS guest_imports (id TEXT PRIMARY KEY, account TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS account_keepsakes (account TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(account,id));`);
  const flowColumns = db.prepare('PRAGMA table_info(garden_auth_flows)').all().map(column => column.name);
  if (!flowColumns.includes('email')) db.exec("ALTER TABLE garden_auth_flows ADD COLUMN email TEXT NOT NULL DEFAULT ''");
  if (!flowColumns.includes('attempts')) db.exec('ALTER TABLE garden_auth_flows ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0');
  function transaction<T>(action: () => T): T {
    db.exec('BEGIN IMMEDIATE');
    try { const value = action(); db.exec('COMMIT'); return value; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  function ocean(account: string): OceanCollection {
    const row = db.prepare('SELECT payload FROM account_oceans WHERE account = ?').get(account);
    return row ? JSON.parse(String(row.payload)) : emptyCollection();
  }
  function saveOcean(account: string, value: OceanCollection) {
    db.prepare('INSERT INTO account_oceans VALUES (?,?) ON CONFLICT(account) DO UPDATE SET payload=excluded.payload').run(account, JSON.stringify(value));
  }
  return {
    start(state: string, nonce: string, destination: string, email = '') {
      const now = Date.now();
      db.prepare('DELETE FROM garden_auth_flows WHERE expires < ?').run(now);
      db.prepare('DELETE FROM garden_sessions WHERE expires < ?').run(now);
      db.prepare('INSERT INTO garden_auth_flows (state,nonce,destination,expires,email) VALUES (?,?,?,?,?)').run(digest(state), digest(nonce), destination, now + 600_000, email);
    },
    pending(state: string, nonce: string) {
      const row = db.prepare('UPDATE garden_auth_flows SET attempts=attempts+1 WHERE state=? AND nonce=? AND expires>? AND attempts<8 RETURNING email,destination').get(digest(state), digest(nonce), Date.now());
      if (!row || !row.email) throw new GardenError(401, 'Please request a fresh sign-in code from the garden.');
      return { email: String(row.email), destination: String(row.destination) };
    },
    consume(state: string, nonce: string) {
      const row = db.prepare('DELETE FROM garden_auth_flows WHERE state=? AND nonce=? AND expires>? RETURNING destination').get(digest(state), digest(nonce), Date.now());
      if (!row) throw new GardenError(401, 'This sign-in attempt has expired. Please start again from the garden.');
      return String(row.destination);
    },
    createSession(token: string, user: GardenAccount) {
      transaction(() => {
        db.prepare('INSERT INTO garden_accounts VALUES (?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name').run(user.id, user.name);
        db.prepare('INSERT INTO garden_sessions VALUES (?,?,?)').run(digest(token), user.id, Date.now() + 30 * 86400_000);
      });
    },
    session(token: string): GardenAccount | null {
      const row = db.prepare('SELECT a.id,a.name FROM garden_sessions s JOIN garden_accounts a ON a.id=s.account WHERE s.token=? AND s.expires>?').get(digest(token), Date.now());
      return row ? { id: String(row.id), name: String(row.name) } : null;
    },
    logout(token: string) { db.prepare('DELETE FROM garden_sessions WHERE token=?').run(digest(token)); },
    ocean,
    catchFish(account: string, value: unknown) {
      const request = value as CatchRequest;
      if (!request || !validId(request.id) || !['case', 'shop'].includes(request.source)) throw new GardenError(400, 'Choose a fish case or a visitor from the live shop.');
      const normalized = request.source === 'case'
        ? { id: request.id, source: request.source, habitat: request.habitat }
        : { id: request.id, source: request.source, tide: request.tide, index: request.index };
      const signature = JSON.stringify(normalized);
      return transaction(() => {
        const previous = db.prepare('SELECT request,fish FROM account_catches WHERE account=? AND event=?').get(account, request.id);
        if (previous) {
          if (previous.request !== signature) throw new GardenError(409, 'Please finish saving your previous catch first.');
          return { ocean: ocean(account), fishId: String(previous.fish) };
        }
        const current = ocean(account);
        let next: OceanCollection, fishId: string;
        if (request.source === 'case') {
          if (!cases.some(item => item.id === request.habitat)) throw new GardenError(400, 'Choose one of the three fish cases.');
          const fish = rollFish(request.habitat); fishId = fish.id;
          next = addFish(current, fish, 'case');
        } else {
          const now = Date.now(), offer = shopAt(now)[request.index];
          if (!offer || offer.tide !== request.tide) throw new GardenError(409, 'The tide changed. Take a look at the new arrivals.');
          const claimed = claimOffer(current, offer, now);
          if (!claimed) throw new GardenError(409, 'You already brought this visitor home.');
          next = claimed; fishId = offer.fish.id;
        }
        saveOcean(account, next);
        db.prepare('INSERT INTO account_catches VALUES (?,?,?,?)').run(account, request.id, signature, fishId);
        return { ocean: next, fishId };
      });
    },
    importGuest(account: string, value: unknown) {
      const payload = value as { id: string; ocean: OceanCollection; plants: unknown };
      if (!payload || !validId(payload.id) || !validCollection(payload.ocean) || !Array.isArray(payload.plants) || payload.plants.length > 1000) throw new GardenError(400, 'Your device collection could not be read.');
      return transaction(() => {
        // A browser import may be retried, even after switching accounts, but can
        // only ever be credited once. Shared plants are claimed via the cookie.
        if (db.prepare('SELECT id FROM guest_imports WHERE id=?').get(payload.id)) return;
        const next = ocean(account);
        for (const [id, amount] of Object.entries(payload.ocean.fish)) next.fish[id] = Math.min(1_000_000, (next.fish[id] ?? 0) + amount);
        next.opened = Math.min(1_000_000, next.opened + payload.ocean.opened);
        next.lastCatch = payload.ocean.lastCatch ?? next.lastCatch;
        if (payload.ocean.claimedTide > next.claimedTide) { next.claimedTide = payload.ocean.claimedTide; next.claimed = payload.ocean.claimed; }
        else if (payload.ocean.claimedTide === next.claimedTide) next.claimed = [...new Set([...next.claimed, ...payload.ocean.claimed])];
        saveOcean(account, next);
        for (const plant of parsePlantings({ version: 1, plants: payload.plants }).filter(plant => !plant.shared)) {
          db.prepare('INSERT INTO account_keepsakes VALUES (?,?,?) ON CONFLICT(account,id) DO UPDATE SET payload=excluded.payload').run(account, plant.id, JSON.stringify(plant));
        }
        db.prepare('INSERT INTO guest_imports VALUES (?,?)').run(payload.id, account);
      });
    },
    keepsakes(account: string) { return db.prepare('SELECT payload FROM account_keepsakes WHERE account=?').all(account).map(row => JSON.parse(String(row.payload))); },
    putKeepsake(account: string, value: unknown) {
      const plant = parsePlantings({ version: 1, plants: [value] })[0];
      if (!plant || plant.shared || !/^[a-zA-Z0-9_-]{1,80}$/.test(plant.id)) throw new GardenError(400, 'That private planting could not be read.');
      db.prepare('INSERT INTO account_keepsakes VALUES (?,?,?) ON CONFLICT(account,id) DO UPDATE SET payload=excluded.payload').run(account, plant.id, JSON.stringify(plant));
      return plant;
    },
    removeKeepsake(account: string, id: string) { return !!db.prepare('DELETE FROM account_keepsakes WHERE account=? AND id=?').run(account, id).changes; },
    close() { db.close(); },
  };
}
