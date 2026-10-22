const bcrypt = require('bcryptjs');
const { pool } = require('../src/db');
require('dotenv').config();

async function seedAdmin() {
  console.log('👤 Running secure admin user seed script...');

  const args = process.argv.slice(2);
  const username = (args[0] || process.env.INITIAL_ADMIN_USERNAME || 'admin').trim();
  const email = (args[1] || process.env.INITIAL_ADMIN_EMAIL || 'admin@slidesolve.com').trim().toLowerCase();
  const password = args[2] || process.env.INITIAL_ADMIN_PASSWORD || 'Admin@12345';

  if (!username || !email || !password) {
    console.error('❌ Error: username, email, and password are required.');
    console.log('Usage: node scripts/seed-admin.js [username] [email] [password]');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    const client = await pool.connect();
    try {
      console.log(`🔐 Generating bcrypt salt and hashing password (cost: 12 rounds)...`);
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Check if user with same username or email exists
      const existingUserQuery = `
        SELECT id, username, email FROM admin_users 
        WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)
      `;
      const existingRes = await client.query(existingUserQuery, [username, email]);

      if (existingRes.rows.length > 0) {
        const existing = existingRes.rows[0];
        console.log(`ℹ️ Admin user already exists (ID: ${existing.id}, Username: "${existing.username}", Email: "${existing.email}").`);
        console.log(`🔄 Updating password hash and updated_at timestamp...`);
        
        await client.query(
          `UPDATE admin_users 
           SET username = $1, email = $2, password_hash = $3, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $4`,
          [username, email, passwordHash, existing.id]
        );
        console.log(`✅ Admin user credentials updated successfully!`);
      } else {
        await client.query(
          `INSERT INTO admin_users (username, email, password_hash) 
           VALUES ($1, $2, $3)`,
          [username, email, passwordHash]
        );
        console.log(`✅ New Admin user created successfully!`);
      }

      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🔑 Admin Login Credentials:`);
      console.log(`   Username : ${username}`);
      console.log(`   Email    : ${email}`);
      console.log(`   Password : [REDACTED - Set from script]`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;
