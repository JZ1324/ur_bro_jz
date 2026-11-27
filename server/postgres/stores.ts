import { createPostgresGardenStore } from './gardenStore.ts';
import { createPostgresAccountStore } from './accountStore.ts';
import { connectDatabase, type Database } from './database.ts';
export function createPostgresStores(db: Database = connectDatabase()) {
  return { store: createPostgresGardenStore(db), accounts: createPostgresAccountStore(db), close: () => db.close() };
}
