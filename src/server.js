const app = require('./app');
const { pool } = require('./db');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 Slide & Solve - Google Ads Admin Server running!`);
  console.log(`📡 Local Server URL: http://localhost:${PORT}`);
  console.log(`🔐 Admin Panel     : http://localhost:${PORT}/admin/login`);
  console.log(`⚙️ Ads Config Page : http://localhost:${PORT}/admin/google-ads`);
  console.log(`📱 Public Ads API  : http://localhost:${PORT}/api/v1/config/google-ads`);
  console.log(`=======================================================`);

  // Verify DB connectivity
  try {
    const res = await pool.query('SELECT current_database(), current_user;');
    console.log(`✅ PostgreSQL Connected to database: '${res.rows[0].current_database}' as user: '${res.rows[0].current_user}'`);
  } catch (dbErr) {
    console.error('❌ Warning: PostgreSQL connection failed on startup:', dbErr.message);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server...');
  server.close(async () => {
    console.log('HTTP server closed.');
    await pool.end();
    console.log('PostgreSQL pool has ended.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server...');
  server.close(async () => {
    console.log('HTTP server closed.');
    await pool.end();
    console.log('PostgreSQL pool has ended.');
    process.exit(0);
  });
});
