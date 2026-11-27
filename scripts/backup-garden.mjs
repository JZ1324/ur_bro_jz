import { DatabaseSync, backup } from 'node:sqlite';
import { resolve } from 'node:path';
import { mkdir, access } from 'node:fs/promises';
import { dirname } from 'node:path';
const source = resolve(process.env.GARDEN_DATABASE ?? '.garden-data/plantings.sqlite');
const destination = process.argv[2];
if (!destination) throw new Error('Usage: GARDEN_DATABASE=/path/plantings.sqlite node scripts/backup-garden.mjs /backup/garden.sqlite');
await access(source);
const target = resolve(destination);
if (source === target) throw new Error('Backup must use a separate destination.');
try { await access(target); throw new Error('Backup destination already exists; choose a new filename.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(dirname(target), { recursive: true });
const db = new DatabaseSync(source, { readOnly: true });
try { await backup(db, target); console.log(`Garden backup saved to ${target}`); }
finally { db.close(); }
