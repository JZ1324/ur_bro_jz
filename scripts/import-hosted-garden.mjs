import { DatabaseSync } from 'node:sqlite';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { connectDatabase } from '../server/postgres/database.ts';

export const tables = {
  plantings: ['sequence','id','owner','category','payload','created_at'],
  publisher_limits: ['owner','last_published_at'],
  removed_plantings: ['id','owner','created_at'],
  garden_accounts: ['id','name'],
  garden_sessions: ['token','account','expires'],
  garden_auth_flows: ['state','nonce','destination','expires','email','attempts'],
  account_oceans: ['account','payload'],
  account_catches: ['account','event','request','fish'],
  guest_imports: ['id','account'],
  account_keepsakes: ['account','id','payload'],
};
export async function importRows(db, data) {
  const keys = { plantings:['id'],publisher_limits:['owner'],removed_plantings:['id'],garden_accounts:['id'],garden_sessions:['token'],garden_auth_flows:['state'],account_oceans:['account'],account_catches:['account','event'],guest_imports:['id'],account_keepsakes:['account','id'] };
  await db.transaction(async tx => {
    await tx.query("SELECT pg_advisory_xact_lock(hashtextextended('garden-migration',0))");
    for (const [table, columns] of Object.entries(tables)) {
      for (const row of data[table] ?? []) {
        const values = columns.map(column => row[column]);
        const result = await tx.query(`INSERT INTO garden_private.${table} (${columns.join(',')}) ${table === 'plantings' ? 'OVERRIDING SYSTEM VALUE' : ''} VALUES (${columns.map((_,i)=>`$${i+1}`).join(',')}) ON CONFLICT DO NOTHING RETURNING *`, values);
        if (!result.length) {
          const [existing] = await tx.query(`SELECT * FROM garden_private.${table} WHERE ${keys[table].map((key,i)=>`${key}=$${i+1}`).join(' AND ')}`, keys[table].map(key=>row[key]));
          if (!existing || columns.some(column => String(existing[column]) !== String(row[column]))) throw new Error('Import conflict; no records were changed.');
        }
      }
    }
    await tx.query("SELECT setval(pg_get_serial_sequence('garden_private.plantings','sequence'),greatest(coalesce((SELECT max(sequence) FROM garden_private.plantings),0),1),(SELECT count(*)>0 FROM garden_private.plantings))");
    await tx.query(`INSERT INTO garden_private.publisher_limits SELECT owner,max(created_at) FROM garden_private.plantings GROUP BY owner
      ON CONFLICT(owner) DO UPDATE SET last_published_at=greatest(publisher_limits.last_published_at,excluded.last_published_at)`);
  });
}

// Importable for tests; CLI never prints names, notes, tokens or connection errors.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  let sqlite, db;
  try {
    const source = resolve(process.env.GARDEN_DATABASE ?? '../.garden-data/plantings.sqlite');
    await access(source);
    sqlite = new DatabaseSync(source, { readOnly: true });
    sqlite.exec('BEGIN');
    const present = new Set(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row=>row.name));
    const data = {};
    for (const table of Object.keys(tables)) data[table] = present.has(table) ? sqlite.prepare(`SELECT * FROM ${table}`).all() : [];
    sqlite.exec('COMMIT');
    console.log('Source row counts:', Object.fromEntries(Object.entries(data).map(([table,rows])=>[table,rows.length])));
    if (process.argv.includes('--apply')) { db=connectDatabase(); await importRows(db,data); console.log('Import verified and committed.'); }
    else console.log('Dry run only. Use --apply after backing up the source and pausing writes.');
  } catch { console.error('Import failed. Check access, schema, and conflicting records. The source database was not changed.'); process.exitCode=1; }
  finally { sqlite?.close(); await db?.close(); }
}
