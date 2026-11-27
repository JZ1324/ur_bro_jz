import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { isPlant, plantCatalog, plantInfo, type CommunityPlant, type GardenPlant } from '../src/garden/plantings.ts';
import { copyFlowerDesign } from '../src/garden/flowerDesign.ts';
import { validateServerPlantText } from './moderation.ts';

import { GardenError, PAGE_SIZE, PUBLISH_COOLDOWN_MS } from './gardenRules.ts';
export { GardenError, PAGE_SIZE, PUBLISH_COOLDOWN_MS } from './gardenRules.ts';
type Row = { id: string; owner: string; payload: string; created_at: number };

export function openGardenStore(path: string) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS plantings (
      sequence INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE,
      owner TEXT NOT NULL, category TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS plantings_category ON plantings(category, sequence DESC);
    CREATE INDEX IF NOT EXISTS plantings_owner ON plantings(owner, created_at);
    CREATE TABLE IF NOT EXISTS publisher_limits (
      owner TEXT PRIMARY KEY, last_published_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS removed_plantings (
      id TEXT PRIMARY KEY, owner TEXT NOT NULL, created_at INTEGER NOT NULL
    );`);
  // Seed cooldowns for records created before weekly limits were introduced.
  db.exec(`INSERT INTO publisher_limits (owner, last_published_at)
    SELECT owner, max(created_at) FROM plantings GROUP BY owner
    ON CONFLICT(owner) DO NOTHING;`);
  const get = db.prepare('SELECT id, owner, payload, created_at FROM plantings WHERE id = ?');
  const publicPlant = (row: Row, owner: string): CommunityPlant => ({ ...JSON.parse(row.payload), id: row.id, createdAt: row.created_at, shared: true, accountLinked: row.owner.startsWith('account:'), canEdit: row.owner === owner });
  function validate(value: unknown): GardenPlant {
    if (!isPlant(value) || !/^[a-zA-Z0-9_-]{1,80}$/.test(value.id)) throw new GardenError(400, 'Please choose a plant and valid colours.');
    const moderation = validateServerPlantText(value.author, value.note);
    if (moderation.ok === false) throw new GardenError(400, moderation.message);
    // Explicit fields prevent client-only state or arbitrary properties entering the public record.
    return { id: value.id, createdAt: value.createdAt, kind: value.kind, palette: value.palette,
      colors: { ...value.colors }, ...(value.kind === 'custom-flower' ? { design: copyFlowerDesign(value.design!) } : {}), note: value.note.trim(), author: value.author.trim(), shared: true };
  }
  return {
    owned(owner: string) { return (db.prepare('SELECT id,owner,payload,created_at FROM plantings WHERE owner=? ORDER BY sequence').all(owner) as Row[]).map(row => publicPlant(row, owner)); },
    claimGuest(guest: string, account: string, name: string) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const rows = db.prepare('SELECT id,payload FROM plantings WHERE owner=?').all(guest);
        for (const row of rows) db.prepare('UPDATE plantings SET owner=?,payload=? WHERE id=? AND owner=?').run(account, JSON.stringify({ ...JSON.parse(String(row.payload)), author: name }), row.id, guest);
        db.prepare('UPDATE removed_plantings SET owner=? WHERE owner=?').run(account, guest);
        db.prepare(`INSERT INTO publisher_limits (owner,last_published_at) SELECT ?,last_published_at FROM publisher_limits WHERE owner=?
          ON CONFLICT(owner) DO UPDATE SET last_published_at=max(last_published_at,excluded.last_published_at)`).run(account, guest);
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    list(owner: string, category = 'all', requestedPage = 1) {
      if (!['all', ...new Set(plantCatalog.map(p => p.category))].includes(category)) throw new GardenError(400, 'Choose a garden category.');
      const total = Number(db.prepare('SELECT count(*) AS n FROM plantings').get()!.n);
      const count = category === 'all' ? total : Number(db.prepare('SELECT count(*) AS n FROM plantings WHERE category = ?').get(category)!.n);
      const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
      const page = Math.min(pages, Math.max(1, Math.floor(Number.isFinite(requestedPage) ? requestedPage : 1)));
      const rows = (category === 'all'
        ? db.prepare('SELECT id, owner, payload, created_at FROM plantings ORDER BY sequence DESC LIMIT ? OFFSET ?').all(PAGE_SIZE, (page - 1) * PAGE_SIZE)
        : db.prepare('SELECT id, owner, payload, created_at FROM plantings WHERE category = ? ORDER BY sequence DESC LIMIT ? OFFSET ?').all(category, PAGE_SIZE, (page - 1) * PAGE_SIZE)) as Row[];
      return { plants: rows.map(row => publicPlant(row, owner)), total, count, page, pages };
    },
    put(value: unknown, owner: string, editing = false): CommunityPlant {
      const plant = validate(value);
      const existing = get.get(plant.id) as Row | undefined;
      if ((existing && existing.owner !== owner) || (editing && !existing)) throw new GardenError(404, 'This planting is no longer available to edit from this browser.');
      // Retrying an interrupted publish must not create a second plant.
      if (existing && !editing) return publicPlant(existing, owner);
      const removed = !existing ? db.prepare('SELECT owner, created_at FROM removed_plantings WHERE id = ?').get(plant.id) as Pick<Row, 'owner' | 'created_at'> | undefined : undefined;
      if (removed && removed.owner !== owner) throw new GardenError(404, 'This planting cannot be restored from this browser.');
      const createdAt = existing?.created_at ?? removed?.created_at ?? Date.now();
      if (!existing && !removed) {
        const limit = db.prepare('SELECT last_published_at FROM publisher_limits WHERE owner = ?').get(owner) as { last_published_at: number } | undefined;
        const previous = limit?.last_published_at ?? Number(db.prepare('SELECT max(created_at) AS latest FROM plantings WHERE owner = ?').get(owner)!.latest ?? 0);
        if (previous && createdAt - previous < PUBLISH_COOLDOWN_MS) throw new GardenError(429, 'You can add one shared planting every seven days. Your next little patch will be ready later.');
      }
      const payload = JSON.stringify({ ...plant, createdAt });
      if (existing) db.prepare('UPDATE plantings SET category = ?, payload = ? WHERE id = ? AND owner = ?').run(plantInfo(plant.kind).category, payload, plant.id, owner);
      else {
        db.prepare('INSERT INTO plantings (id, owner, category, payload, created_at) VALUES (?, ?, ?, ?, ?)').run(plant.id, owner, plantInfo(plant.kind).category, payload, createdAt);
        // Undo restores the same slot; it neither spends nor resets a weekly slot.
        if (removed) db.prepare('DELETE FROM removed_plantings WHERE id = ? AND owner = ?').run(plant.id, owner);
        else db.prepare(`INSERT INTO publisher_limits (owner, last_published_at) VALUES (?, ?)
          ON CONFLICT(owner) DO UPDATE SET last_published_at = excluded.last_published_at`).run(owner, createdAt);
      }
      return { ...plant, createdAt, accountLinked: owner.startsWith('account:'), canEdit: true };
    },
    remove(id: string, owner: string) {
      db.exec('BEGIN IMMEDIATE');
      try {
        // Retain only ownership metadata for Undo, never the removed name or note.
        db.prepare(`INSERT OR REPLACE INTO removed_plantings (id, owner, created_at)
          SELECT id, owner, created_at FROM plantings WHERE id = ? AND owner = ?`).run(id, owner);
        const result = db.prepare('DELETE FROM plantings WHERE id = ? AND owner = ?').run(id, owner);
        if (!result.changes) throw new GardenError(404, 'This planting is no longer available to remove from this browser.');
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    close() { db.close(); },
  };
}
