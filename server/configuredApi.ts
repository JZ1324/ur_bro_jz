import { createGardenApi } from './gardenApi.ts';
import { connectDatabase } from './postgres/database.ts';
import { createPostgresStores } from './postgres/stores.ts';
import { createPostgresLimiter } from './postgres/rateLimit.ts';

export function createConfiguredGardenApi() {
  if (!process.env.GARDEN_DATABASE_URL) {
    if (process.env.VERCEL) throw new Error('GARDEN_DATABASE_URL must be configured on Vercel.');
    return createGardenApi();
  }
  const db = connectDatabase();
  const api = createGardenApi(undefined, { stores: createPostgresStores(db), limiter: createPostgresLimiter(db) });
  return { handle: api.handle, close() { void db.close(); } };
}
