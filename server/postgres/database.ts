import postgres from 'postgres';

export type Database = {
  query<T extends Record<string, any> = Record<string, any>>(text: string, params?: any[]): Promise<T[]>;
  transaction<T>(action: (db: Database) => Promise<T>): Promise<T>;
  close(): Promise<void>;
};

export function validateDatabaseTarget(value: string) {
  const target = new URL(value);
  const project = new URL(process.env.GARDEN_SUPABASE_URL ?? 'https://uajpewjagduzdpwlynrv.supabase.co').hostname.split('.')[0];
  const direct = target.hostname === `db.${project}.supabase.co`;
  const pooled = target.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(target.username).endsWith(`.${project}`);
  if (!['postgres:', 'postgresql:'].includes(target.protocol) || (!direct && !pooled)) throw new Error('Database URI must belong to the configured Supabase project.');
}

export function connectDatabase(url = process.env.GARDEN_DATABASE_URL): Database {
  if (!url) throw new Error('GARDEN_DATABASE_URL is required for the hosted garden.');
  validateDatabaseTarget(url);
  const client = postgres(url, { prepare: false, max: 3, idle_timeout: 20, connect_timeout: 10, ssl: 'require' });
  const wrap = (sql: any): Database => ({
    query: (text, params = []) => { const query = sql.unsafe(text, params); return params.length ? query : query.simple(); },
    transaction: action => sql.begin((tx: any) => action(wrap(tx))),
    close: () => client.end({ timeout: 5 }),
  });
  return wrap(client);
}

// A database lock works across Vercel instances. Sorted keys avoid deadlocks.
export async function locked<T>(db: Database, keys: string[], action: (tx: Database) => Promise<T>): Promise<T> {
  return db.transaction(async tx => {
    for (const key of [...new Set(keys)].sort()) await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [key]);
    return action(tx);
  });
}
