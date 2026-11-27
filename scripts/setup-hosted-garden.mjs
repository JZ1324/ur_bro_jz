import { readFile } from 'node:fs/promises';
import { connectDatabase } from '../server/postgres/database.ts';
const db = connectDatabase();
try {
  await db.transaction(async tx => {
    await tx.query(await readFile(new URL('../server/postgres/schema.sql', import.meta.url), 'utf8'));
    const [result] = await tx.query("SELECT count(*) AS n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='garden_private' AND c.relkind='r' AND c.relrowsecurity");
    if (Number(result.n) !== 11) throw new Error('Hosted garden schema verification failed.');
  });
  console.log('Hosted garden schema applied; all 11 tables have RLS enabled.');
} catch {
  // Connection errors may contain the URI or password. Never log raw driver errors.
  console.error('Hosted schema setup failed. Check the private database connection and permissions.');
  process.exitCode = 1;
} finally { await db.close(); }
