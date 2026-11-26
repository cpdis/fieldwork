// Applies supabase/migrations/*.sql in order, once each. Works against Supabase
// or any local Postgres. With the Supabase CLI you can use `supabase db push` instead.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const sql = postgres(url, { max: 1, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require', onnotice: () => {} });
const dir = join(import.meta.dirname, '..', 'supabase', 'migrations');

await sql`create table if not exists _fieldwork_migrations (name text primary key, applied_at timestamptz not null default now())`;
const done = new Set((await sql`select name from _fieldwork_migrations`).map((r) => r.name));
for (const file of (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()) {
  if (done.has(file)) continue;
  const text = await readFile(join(dir, file), 'utf8');
  await sql.begin(async (tx) => {
    await tx.unsafe(text);
    await tx`insert into _fieldwork_migrations (name) values (${file})`;
  });
  console.log(`applied ${file}`);
}
await sql.end();
