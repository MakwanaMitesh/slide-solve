/**
 * Helper to validate boolean types
 */
function isBoolean(val) {
  return typeof val === 'boolean' || val === 'true' || val === 'false';
}

function parseBoolean(val, fallback = false) {
  if (typeof val === 'boolean') return val;
  if (val === 'true') return true;
  if (val === 'false') return false;
  return fallback;
}

/**
 * Validates Google Ads configuration payload.
 * Returns { valid: boolean, errors: string[], data: object }
 */
function validateGoogleAdsConfig(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a valid JSON object.'] };
  }

  // Validate General Settings
  if (body.ads_enabled !== undefined && !isBoolean(body.ads_enabled)) {
    errors.push('ads_enabled must be a boolean (true or false).');
  }
  if (body.test_mode !== undefined && !isBoolean(body.test_mode)) {
    errors.push('test_mode must be a boolean (true or false).');
  }

  // Validate Android Settings
  if (body.android !== undefined && (typeof body.android !== 'object' || body.android === null)) {
    errors.push('android must be an object containing Android ad unit IDs.');
  }

  // Validate iOS Settings
  if (body.ios !== undefined && (typeof body.ios !== 'object' || body.ios === null)) {
    errors.push('ios must be an object containing iOS ad unit IDs.');
  }

  // Validate Ad Settings
  if (body.ad_settings !== undefined) {
    const s = body.ad_settings;
    if (typeof s !== 'object' || s === null) {
      errors.push('ad_settings must be an object containing ad format toggles and frequency settings.');
    } else {
      ['banner_enabled', 'interstitial_enabled', 'rewarded_enabled', 'app_open_enabled', 'native_enabled'].forEach((key) => {
        if (s[key] !== undefined && !isBoolean(s[key])) {
          errors.push(`ad_settings.${key} must be a boolean (true or false).`);
        }
      });

      if (s.interstitial_frequency !== undefined) {
        const freq = Number(s.interstitial_frequency);
        if (!Number.isInteger(freq) || freq < 1) {
          errors.push('ad_settings.interstitial_frequency must be an integer greater than or equal to 1.');
        }
      }

      if (s.rewarded_coins !== undefined) {
        const coins = Number(s.rewarded_coins);
        if (!Number.isInteger(coins) || coins < 0) {
          errors.push('ad_settings.rewarded_coins must be an integer greater than or equal to 0.');
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateGoogleAdsConfig,
  parseBoolean
};
