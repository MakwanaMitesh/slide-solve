const { Pool } = require('pg');
require('dotenv').config();

const isRemoteDb = Boolean(
  process.env.DATABASE_URL ||
  (process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1')
);

// Clean DATABASE_URL if channel_binding is present (can cause handshake errors in node-pg)
let cleanDatabaseUrl = process.env.DATABASE_URL;
if (cleanDatabaseUrl) {
  cleanDatabaseUrl = cleanDatabaseUrl.replace(/&channel_binding=require/g, '').replace(/\?channel_binding=require&?/g, '?');
  if (cleanDatabaseUrl.endsWith('?')) {
    cleanDatabaseUrl = cleanDatabaseUrl.slice(0, -1);
  }
}

const poolConfig = cleanDatabaseUrl
  ? {
      connectionString: cleanDatabaseUrl,
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || undefined,
      database: process.env.DB_NAME || 'slide_solve_ads',
      ssl: (isRemoteDb || process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true')
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect()
};
