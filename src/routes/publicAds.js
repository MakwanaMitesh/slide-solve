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
      message: 'Failed to retrieve Google Ads configuration.'
    });
  }
});

module.exports = router;
