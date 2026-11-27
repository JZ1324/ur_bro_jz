// Browser tests run the production PostgreSQL stores without hosted credentials.
import { PGlite } from '@electric-sql/pglite';
import { createServer, loadConfigFromFile } from 'vite';
import { readFile } from 'node:fs/promises';
import { createGardenApi } from '../server/gardenApi.ts';
import { createPostgresStores } from '../server/postgres/stores.ts';
import { createPostgresLimiter } from '../server/postgres/rateLimit.ts';
const pg = new PGlite();
await pg.exec(await readFile(new URL('../server/postgres/schema.sql', import.meta.url), 'utf8'));
const wrap = client => ({
  query: async (text, params=[]) => (await client.query(text, params)).rows,
  transaction: action => client.transaction(tx => action(wrap(tx))),
  close: () => pg.close(),
});
const db = wrap(pg);
const api = createGardenApi(undefined, { stores: createPostgresStores(db), limiter: createPostgresLimiter(db) });
const { config } = await loadConfigFromFile({ command: 'serve', mode: 'test' });
const server = await createServer({ ...config, configFile: false, server: { ...config.server, port: 5189 },
  plugins: [...config.plugins.filter(plugin => plugin?.name !== 'shared-garden-api'), {
    name: 'test-postgres-api',
    configureServer(vite) { vite.middlewares.use((req,res,next) => { void api.handle(req,res,next); }); },
  }],
});
await server.listen();
for (const signal of ['SIGTERM','SIGINT']) process.once(signal, async () => { await server.close(); await pg.close(); process.exit(0); });
