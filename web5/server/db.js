import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://notes:notes@localhost:5432/notes',
  max: 10,
  idleTimeoutMillis: 30_000
});

pool.on('error', error => {
  console.error('Unexpected PostgreSQL error', error);
});
