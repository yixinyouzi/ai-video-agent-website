import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

let pool: mysql.Pool | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getDbPool(): mysql.Pool {
  if (pool) {
    return pool;
  }

  pool = mysql.createPool({
    host: getRequiredEnv('MYSQL_HOST'),
    port: Number(process.env.MYSQL_PORT ?? '3306'),
    database: getRequiredEnv('MYSQL_DATABASE'),
    user: getRequiredEnv('MYSQL_USER'),
    password: getRequiredEnv('MYSQL_PASSWORD'),
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT ?? '10'),
    charset: 'utf8mb4',
  });

  return pool;
}
