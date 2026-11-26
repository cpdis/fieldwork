import postgres from 'postgres';

export type Sql = postgres.Sql | postgres.TransactionSql;

declare global {
  // Reused across hot reloads in dev and across invocations of a warm serverless function.
  var __fieldworkSql: postgres.Sql | undefined;
}

/**
 * Server-side connection. On Vercel, point DATABASE_URL at Supabase's transaction
 * pooler (port 6543). postgres.js 4 does not prepare statements by default, which
 * the transaction pooler needs.
 */
export function getSql(): postgres.Sql {
  if (!globalThis.__fieldworkSql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    globalThis.__fieldworkSql = postgres(url, {
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      idle_timeout: 20,
      ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require',
    });
  }
  return globalThis.__fieldworkSql;
}
