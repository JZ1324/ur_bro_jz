import { GardenError } from '../gardenRules.ts';
import type { Database } from './database.ts';
export const createPostgresLimiter = (db: Database) => async (key: string, limit: number) => {
  const now = Date.now();
  await db.query('DELETE FROM garden_private.rate_limits WHERE expires<$1', [now]);
  const [row] = await db.query(`INSERT INTO garden_private.rate_limits VALUES ($1,1,$2)
    ON CONFLICT(key) DO UPDATE SET count=rate_limits.count+1 RETURNING count`, [key, now + 3_600_000]);
  if (row.count > limit) throw new GardenError(429, 'The garden is taking a little breather. Please try again later.');
};
