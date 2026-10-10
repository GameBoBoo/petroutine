import pg from 'pg';

const { Pool } = pg;
const globalForDb = globalThis;
export const pool = globalForDb.pawroutinePool || new Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== 'production') globalForDb.pawroutinePool = pool;
