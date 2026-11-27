import { GardenError, PAGE_SIZE, PUBLISH_COOLDOWN_MS } from '../gardenRules.ts';
import { isPlant, plantCatalog, plantInfo, type CommunityPlant, type GardenPlant } from '../../src/garden/plantings.ts';
import { copyFlowerDesign } from '../../src/garden/flowerDesign.ts';
import { validateServerPlantText } from '../moderation.ts';
import { locked, type Database } from './database.ts';

type Row = { id: string; owner: string; payload: string; created_at: number | string };
const publicPlant = (row: Row, owner: string): CommunityPlant => ({ ...JSON.parse(row.payload), id: row.id, createdAt: Number(row.created_at), shared: true, accountLinked: row.owner.startsWith('account:'), canEdit: row.owner === owner });
function validate(value: unknown): GardenPlant {
  if (!isPlant(value) || !/^[a-zA-Z0-9_-]{1,80}$/.test(value.id)) throw new GardenError(400, 'Please choose a plant and valid colours.');
  const moderation = validateServerPlantText(value.author, value.note);
  if (moderation.ok === false) throw new GardenError(400, moderation.message);
  return { id: value.id, createdAt: value.createdAt, kind: value.kind, palette: value.palette, colors: { ...value.colors },
    ...(value.kind === 'custom-flower' ? { design: copyFlowerDesign(value.design!) } : {}), note: value.note.trim(), author: value.author.trim(), shared: true };
}
export function createPostgresGardenStore(db: Database) {
  return {
    async owned(owner: string) {
      return (await db.query<Row>('SELECT * FROM garden_private.plantings WHERE owner=$1 ORDER BY sequence', [owner])).map(row => publicPlant(row, owner));
    },
    async claimGuest(guest: string, account: string, name: string) {
      await locked(db, [`owner:${guest}`, `owner:${account}`], async tx => {
        const rows = await tx.query<Row>('SELECT * FROM garden_private.plantings WHERE owner=$1', [guest]);
        for (const row of rows) await tx.query('UPDATE garden_private.plantings SET owner=$1,payload=$2 WHERE id=$3', [account, JSON.stringify({ ...JSON.parse(row.payload), author: name }), row.id]);
        await tx.query('UPDATE garden_private.removed_plantings SET owner=$1 WHERE owner=$2', [account, guest]);
        await tx.query(`INSERT INTO garden_private.publisher_limits(owner,last_published_at) SELECT $1,last_published_at FROM garden_private.publisher_limits WHERE owner=$2
          ON CONFLICT(owner) DO UPDATE SET last_published_at=greatest(publisher_limits.last_published_at,excluded.last_published_at)`, [account, guest]);
      });
    },
    async list(owner: string, category = 'all', requestedPage = 1) {
      if (!['all', ...new Set(plantCatalog.map(p => p.category))].includes(category)) throw new GardenError(400, 'Choose a garden category.');
      // One statement provides a consistent count and page under concurrent writes.
      const [result] = await db.query<{ total: string; count: string; plants: Row[]; page: number }>(`WITH filtered AS (
        SELECT * FROM garden_private.plantings WHERE $1='all' OR category=$1
      ), counts AS (SELECT count(*) AS n FROM filtered), paging AS (
        SELECT least(greatest(1,ceil(n::numeric/$2)::integer),$3::integer) AS page FROM counts
      ) SELECT (SELECT count(*) FROM garden_private.plantings) AS total, (SELECT n FROM counts) AS count, page,
        coalesce((SELECT json_agg(p) FROM (SELECT id,owner,payload,created_at FROM filtered ORDER BY sequence DESC LIMIT $2 OFFSET (page-1)*$2) p),'[]'::json) AS plants FROM paging`,
      [category, PAGE_SIZE, Math.max(1, Math.min(2147483647, Math.floor(Number.isFinite(requestedPage) ? requestedPage : 1)))]);
      const count = Number(result.count);
      return { plants: result.plants.map(row => publicPlant(row, owner)), total: Number(result.total), count, page: result.page, pages: Math.max(1, Math.ceil(count / PAGE_SIZE)) };
    },
    async put(value: unknown, owner: string, editing = false): Promise<CommunityPlant> {
      const plant = validate(value);
      return locked(db, [`owner:${owner}`, `plant:${plant.id}`], async tx => {
        const [existing] = await tx.query<Row>('SELECT * FROM garden_private.plantings WHERE id=$1', [plant.id]);
        if ((existing && existing.owner !== owner) || (editing && !existing)) throw new GardenError(404, 'This planting is no longer available to edit from this browser.');
        if (existing && !editing) return publicPlant(existing, owner);
        const [removed] = existing ? [] : await tx.query<Row>('SELECT * FROM garden_private.removed_plantings WHERE id=$1', [plant.id]);
        if (removed && removed.owner !== owner) throw new GardenError(404, 'This planting cannot be restored from this browser.');
        const createdAt = Number(existing?.created_at ?? removed?.created_at ?? Date.now());
        if (!existing && !removed) {
          const [limit] = await tx.query('SELECT last_published_at FROM garden_private.publisher_limits WHERE owner=$1', [owner]);
          if (limit && createdAt - Number(limit.last_published_at) < PUBLISH_COOLDOWN_MS) throw new GardenError(429, 'You can add one shared planting every seven days. Your next little patch will be ready later.');
        }
        const payload = JSON.stringify({ ...plant, createdAt });
        if (existing) await tx.query('UPDATE garden_private.plantings SET category=$1,payload=$2 WHERE id=$3', [plantInfo(plant.kind).category, payload, plant.id]);
        else {
          await tx.query('INSERT INTO garden_private.plantings(id,owner,category,payload,created_at) VALUES ($1,$2,$3,$4,$5)', [plant.id, owner, plantInfo(plant.kind).category, payload, createdAt]);
          if (removed) await tx.query('DELETE FROM garden_private.removed_plantings WHERE id=$1', [plant.id]);
          else await tx.query('INSERT INTO garden_private.publisher_limits VALUES ($1,$2) ON CONFLICT(owner) DO UPDATE SET last_published_at=excluded.last_published_at', [owner, createdAt]);
        }
        return { ...plant, createdAt, accountLinked: owner.startsWith('account:'), canEdit: true };
      });
    },
    async remove(id: string, owner: string) {
      await locked(db, [`owner:${owner}`, `plant:${id}`], async tx => {
        const rows = await tx.query<Row>('DELETE FROM garden_private.plantings WHERE id=$1 AND owner=$2 RETURNING *', [id, owner]);
        if (!rows.length) throw new GardenError(404, 'This planting is no longer available to remove from this browser.');
        await tx.query('INSERT INTO garden_private.removed_plantings VALUES ($1,$2,$3) ON CONFLICT(id) DO UPDATE SET owner=excluded.owner,created_at=excluded.created_at', [id, owner, Number(rows[0].created_at)]);
      });
    },
    close() {},
  };
}
