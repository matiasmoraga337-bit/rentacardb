import sql from 'mssql';
import { env } from './env';

const config: sql.config = {
  server: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  connectionTimeout: env.NODE_ENV === 'test' ? 1000 : 10000,
  requestTimeout: 30000,
  options: {
    encrypt: env.DB_ENCRYPT,
    trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    const pool = new sql.ConnectionPool(config);
    const connecting = pool.connect().catch((err: unknown) => {
      poolPromise = null;
      throw err;
    });
    poolPromise = connecting;
  }
  return poolPromise;
}

export async function pingDatabase(): Promise<boolean> {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 AS ok');
    return true;
  } catch {
    return false;
  }
}

export async function closePool(): Promise<void> {
  if (!poolPromise) return;
  const pool = await poolPromise.catch(() => null);
  if (pool) await pool.close();
  poolPromise = null;
}
