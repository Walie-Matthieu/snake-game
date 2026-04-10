import 'server-only';
import mysql from 'mysql2/promise';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const host = getRequiredEnv('DB_HOST');
const port = Number(process.env.DB_PORT ?? 3306);
const user = getRequiredEnv('DB_USER');
const password = getRequiredEnv('DB_PASSWORD');
const database = getRequiredEnv('DB_NAME');
const useSsl = process.env.DB_SSL === 'true';
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';

declare global {
  var mysqlPool: mysql.Pool | undefined;
}

const poolConfig: mysql.PoolOptions = {
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: useSsl ? { rejectUnauthorized } : undefined,
};

export const db = global.mysqlPool ?? mysql.createPool(poolConfig);

if (process.env.NODE_ENV !== 'production') {
  global.mysqlPool = db;
}
