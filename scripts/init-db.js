const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');

async function initDatabase() {
  console.log('🔄 Initializing PostgreSQL database...');
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Error: schema.sql file not found at:', schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    const client = await pool.connect();
    try {
      console.log('📦 Executing schema.sql queries...');
      await client.query(sql);
      console.log('✅ PostgreSQL Schema and initial configuration initialized successfully!');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Failed to initialize database schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
