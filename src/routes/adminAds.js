const express = require('express');
const router = express.Router();
const cors = require('cors');
const { requireAdminApi, verifyCsrfToken } = require('../middleware/auth');
const { validateGoogleAdsConfig } = require('../utils/validation');
const { getFullGoogleAdsConfig, updateGoogleAdsConfig } = require('../services/adsService');

// Enable CORS for clients consuming the ads configuration
const corsOptions = {
  origin: '*',
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

/**
 * GET /api/v1/admin/google-ads
 * Retrieves current Google Ads settings (Public, no authentication required).
 */
router.options('/google-ads', cors(corsOptions));
router.get('/google-ads', cors(corsOptions), async (req, res) => {
  try {
    const config = await getFullGoogleAdsConfig();
    return res.status(200).json({
      success: true,
      message: 'Google Ads configuration fetched successfully',
      data: config
    });
  } catch (error) {
    console.error('Error fetching Google Ads configuration:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve Google Ads settings.'
    });
  }
});

/**
 * PUT /api/v1/admin/google-ads
 * Validates and saves updated settings with PostgreSQL transaction (Admin auth + CSRF required).
 */
router.put('/google-ads', requireAdminApi, verifyCsrfToken, async (req, res) => {
  try {
    const validation = validateGoogleAdsConfig(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: validation.errors[0] || 'Invalid configuration data.',
        errors: validation.errors
      });
    }

    const updatedConfig = await updateGoogleAdsConfig(req.body);

    return res.status(200).json({
      success: true,
      message: 'Google Ads configuration updated successfully',
      data: updatedConfig
    });
  } catch (error) {
    console.error('Error updating Google Ads configuration:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update Google Ads settings. Changes were rolled back.'
    });
  }
});

module.exports = router;
