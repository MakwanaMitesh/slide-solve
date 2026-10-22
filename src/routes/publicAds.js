const express = require('express');
const router = express.Router();
const cors = require('cors');
const { getFullGoogleAdsConfig } = require('../services/adsService');
const { publicApiLimiter } = require('../middleware/rateLimiter');

// Enable CORS for mobile apps and clients consuming the public config
const corsOptions = {
  origin: '*',
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

/**
 * GET /api/v1/config/google-ads
 * Public, read-only endpoint for mobile applications.
 * Returns the exact specified JSON structure with live values from PostgreSQL.
 */
router.get('/google-ads', cors(corsOptions), publicApiLimiter, async (req, res) => {
  try {
    const config = await getFullGoogleAdsConfig();

    return res.status(200).json({
      success: true,
      message: 'Google Ads configuration fetched successfully',
      data: config
    });
  } catch (error) {
    console.error('Error in public Google Ads config API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve Google Ads configuration.',
      details: error.message
    });
  }
});

router.get('/db-debug', async (req, res) => {
  const { pool } = require('../db');
  const info = {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    databaseUrlSnippet: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@') : null,
    dbHost: process.env.DB_HOST || null,
    dbPort: process.env.DB_PORT || null,
    dbUser: process.env.DB_USER || null,
    dbName: process.env.DB_NAME || null,
    hasPassword: Boolean(process.env.DB_PASSWORD)
  };

  try {
    const testRes = await pool.query('SELECT current_database(), current_user;');
    return res.status(200).json({
      success: true,
      connected: true,
      info,
      db: testRes.rows[0]
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      connected: false,
      info,
      error: err.message,
      code: err.code
    });
  }
});

module.exports = router;
