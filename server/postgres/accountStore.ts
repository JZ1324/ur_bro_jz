import { createHash } from 'node:crypto';
import { GardenError } from '../gardenRules.ts';
import type { GardenAccount } from '../gardenAuth.ts';
import { addFish, claimOffer, emptyCollection, validCollection, type OceanCollection } from '../../src/ocean/collection.ts';
import { cases, rollFish, shopAt, type Habitat } from '../../src/ocean/catalog.ts';
import { parsePlantings } from '../../src/garden/plantings.ts';
import { locked, type Database } from './database.ts';

export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const validId = (id: unknown): id is string => typeof id === 'string' && /^[a-zA-Z0-9_-]{8,80}$/.test(id);
type CatchRequest = { id: string; source: 'case'; habitat: Habitat } | { id: string; source: 'shop'; tide: number; index: number };
async function ocean(db: Database, account: string): Promise<OceanCollection> {
  const [row] = await db.query('SELECT payload FROM garden_private.account_oceans WHERE account=$1', [account]);
  return row ? JSON.parse(row.payload) : emptyCollection();
}
const saveOcean = (db: Database, account: string, value: OceanCollection) => db.query('INSERT INTO garden_private.account_oceans VALUES ($1,$2) ON CONFLICT(account) DO UPDATE SET payload=excluded.payload', [account, JSON.stringify(value)]);
export function createPostgresAccountStore(db: Database) {
  return {
    async start(state: string, nonce: string, destination: string, email = '') {
      await db.query('DELETE FROM garden_private.garden_auth_flows WHERE expires<$1', [Date.now()]);
      await db.query('DELETE FROM garden_private.garden_sessions WHERE expires<$1', [Date.now()]);
      await db.query('INSERT INTO garden_private.garden_auth_flows(state,nonce,destination,expires,email) VALUES ($1,$2,$3,$4,$5)', [digest(state), digest(nonce), destination, Date.now() + 600_000, email]);
    },
    async pending(state: string, nonce: string) {
      const [row] = await db.query('UPDATE garden_private.garden_auth_flows SET attempts=attempts+1 WHERE state=$1 AND nonce=$2 AND expires>$3 AND attempts<8 RETURNING email,destination', [digest(state), digest(nonce), Date.now()]);
      if (!row?.email) throw new GardenError(401, 'Please request a fresh sign-in code from the garden.');
      return { email: String(row.email), destination: String(row.destination) };
    },
    async consume(state: string, nonce: string) {
      const [row] = await db.query('DELETE FROM garden_private.garden_auth_flows WHERE state=$1 AND nonce=$2 AND expires>$3 RETURNING destination', [digest(state), digest(nonce), Date.now()]);
      if (!row) throw new GardenError(401, 'This sign-in attempt has expired. Please start again from the garden.');
      return String(row.destination);
    },
    async createSession(token: string, user: GardenAccount) {
      await db.transaction(async tx => {
        await tx.query('INSERT INTO garden_private.garden_accounts VALUES ($1,$2) ON CONFLICT(id) DO UPDATE SET name=excluded.name', [user.id, user.name]);
        await tx.query('INSERT INTO garden_private.garden_sessions VALUES ($1,$2,$3)', [digest(token), user.id, Date.now() + 30 * 86400_000]);
      });
    },
    async session(token: string): Promise<GardenAccount | null> {
      const [row] = await db.query('SELECT a.id,a.name FROM garden_private.garden_sessions s JOIN garden_private.garden_accounts a ON a.id=s.account WHERE s.token=$1 AND s.expires>$2', [digest(token), Date.now()]);
      return row ? { id: String(row.id), name: String(row.name) } : null;
    },
    async logout(token: string) { await db.query('DELETE FROM garden_private.garden_sessions WHERE token=$1', [digest(token)]); },
    ocean: (account: string) => ocean(db, account),
    async catchFish(account: string, value: unknown) {
      const request = value as CatchRequest;
      if (!request || !validId(request.id) || !['case', 'shop'].includes(request.source)) throw new GardenError(400, 'Choose a fish case or a visitor from the live shop.');
      const normalized = request.source === 'case' ? { id: request.id, source: request.source, habitat: request.habitat } : { id: request.id, source: request.source, tide: request.tide, index: request.index };
      const signature = JSON.stringify(normalized);
      return locked(db, [`account:${account}`], async tx => {
        const [previous] = await tx.query('SELECT request,fish FROM garden_private.account_catches WHERE account=$1 AND event=$2', [account, request.id]);
        if (previous) {
          if (previous.request !== signature) throw new GardenError(409, 'Please finish saving your previous catch first.');
          return { ocean: await ocean(tx, account), fishId: String(previous.fish) };
        }
        const current = await ocean(tx, account);
        let next: OceanCollection, fishId: string;
        if (request.source === 'case') {
          if (!cases.some(item => item.id === request.habitat)) throw new GardenError(400, 'Choose one of the three fish cases.');
          const fish = rollFish(request.habitat); fishId = fish.id; next = addFish(current, fish, 'case');
        } else {
          const now = Date.now(), offer = Number.isInteger(request.index) ? shopAt(now)[request.index] : null;
          if (!offer || offer.tide !== request.tide) throw new GardenError(409, 'The tide changed. Take a look at the new arrivals.');
          const claimed = claimOffer(current, offer, now);
          if (!claimed) throw new GardenError(409, 'You already brought this visitor home.');
          next = claimed; fishId = offer.fish.id;
        }
        await saveOcean(tx, account, next);
        await tx.query('INSERT INTO garden_private.account_catches VALUES ($1,$2,$3,$4)', [account, request.id, signature, fishId]);
        return { ocean: next, fishId };
      });
    },
    async importGuest(account: string, value: unknown) {
      const payload = value as { id: string; ocean: OceanCollection; plants: unknown };
      if (!payload || !validId(payload.id) || !validCollection(payload.ocean) || !Array.isArray(payload.plants) || payload.plants.length > 1000) throw new GardenError(400, 'Your device collection could not be read.');
      await locked(db, [`account:${account}`, `import:${payload.id}`], async tx => {
        if ((await tx.query('SELECT id FROM garden_private.guest_imports WHERE id=$1', [payload.id])).length) return;
        const next = await ocean(tx, account);
        for (const [id, amount] of Object.entries(payload.ocean.fish)) next.fish[id] = Math.min(1_000_000, (next.fish[id] ?? 0) + amount);
        next.opened = Math.min(1_000_000, next.opened + payload.ocean.opened);
        next.lastCatch = payload.ocean.lastCatch ?? next.lastCatch;
        if (payload.ocean.claimedTide > next.claimedTide) { next.claimedTide = payload.ocean.claimedTide; next.claimed = payload.ocean.claimed; }
        else if (payload.ocean.claimedTide === next.claimedTide) next.claimed = [...new Set([...next.claimed, ...payload.ocean.claimed])];
        await saveOcean(tx, account, next);
        for (const plant of parsePlantings({ version: 1, plants: payload.plants }).filter(plant => !plant.shared)) await tx.query('INSERT INTO garden_private.account_keepsakes VALUES ($1,$2,$3) ON CONFLICT(account,id) DO UPDATE SET payload=excluded.payload', [account, plant.id, JSON.stringify(plant)]);
        await tx.query('INSERT INTO garden_private.guest_imports VALUES ($1,$2)', [payload.id, account]);
      });
    },
    async keepsakes(account: string) { return (await db.query('SELECT payload FROM garden_private.account_keepsakes WHERE account=$1 ORDER BY id', [account])).map(row => JSON.parse(row.payload)); },
    async putKeepsake(account: string, value: unknown) {
      const plant = parsePlantings({ version: 1, plants: [value] })[0];
      if (!plant || plant.shared || !/^[a-zA-Z0-9_-]{1,80}$/.test(plant.id)) throw new GardenError(400, 'That private planting could not be read.');
      await db.query('INSERT INTO garden_private.account_keepsakes VALUES ($1,$2,$3) ON CONFLICT(account,id) DO UPDATE SET payload=excluded.payload', [account, plant.id, JSON.stringify(plant)]);
      return plant;
    },
    async removeKeepsake(account: string, id: string) { return !!(await db.query('DELETE FROM garden_private.account_keepsakes WHERE account=$1 AND id=$2 RETURNING id', [account, id])).length; },
    close() {},
  };
}
