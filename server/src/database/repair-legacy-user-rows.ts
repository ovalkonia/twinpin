import * as bcrypt from 'bcryptjs';
import { Client } from 'pg';

/**
 * Fills NULL NOT NULL columns on legacy rows so TypeORM synchronize can run.
 * Safe to call on every startup (no-op when nothing to fix).
 */
export async function repairLegacyUserRows(config: {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}): Promise<void> {
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
  });

  try {
    await client.connect();

    const { rows } = await client.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      ) AS exists;
    `);
    if (!rows[0]?.exists) {
      return;
    }

    await client.query(`
      UPDATE users
      SET email = 'legacy-' || id || '@users.twinpin.local'
      WHERE email IS NULL OR btrim(email) = '';
    `);

    const nullPasswords = await client.query(
      `SELECT COUNT(*)::int AS c FROM users WHERE password IS NULL OR btrim(password) = ''`,
    );
    if (Number(nullPasswords.rows[0]?.c) > 0) {
      const hash = await bcrypt.hash('__legacy_no_password__', 10);
      await client.query(`UPDATE users SET password = $1 WHERE password IS NULL`, [
        hash,
      ]);
    }
  } finally {
    await client.end().catch(() => undefined);
  }
}
