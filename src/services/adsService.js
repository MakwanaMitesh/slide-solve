const { pool } = require('../db');
const { parseBoolean } = require('../utils/validation');

/**
 * Fetches the unified Google Ads configuration from PostgreSQL.
 * Formats the response according to the strict specification.
 */
async function getFullGoogleAdsConfig(executor = pool) {
  // 1. Fetch main configuration
  const configRes = await executor.query(
    'SELECT ads_enabled, test_mode FROM google_ads_config WHERE id = 1 LIMIT 1'
  );

  if (configRes.rows.length === 0) {
    throw new Error('Default Google Ads configuration record (id=1) not found in database.');
  }

  const mainConfig = configRes.rows[0];

  // 2. Fetch platform configs (android and ios)
  const platformRes = await executor.query(
    'SELECT platform, app_id, banner_ad_id, interstitial_ad_id, rewarded_ad_id, app_open_ad_id, native_ad_id FROM google_ads_platform_config WHERE config_id = 1'
  );

  const androidConfig = {
    app_id: '',
    banner_ad_id: '',
    interstitial_ad_id: '',
    rewarded_ad_id: '',
    app_open_ad_id: '',
    native_ad_id: ''
  };

  const iosConfig = {
    app_id: '',
    banner_ad_id: '',
    interstitial_ad_id: '',
    rewarded_ad_id: '',
    app_open_ad_id: '',
    native_ad_id: ''
  };

  platformRes.rows.forEach((row) => {
    const target = row.platform === 'android' ? androidConfig : row.platform === 'ios' ? iosConfig : null;
    if (target) {
      target.app_id = row.app_id || '';
      target.banner_ad_id = row.banner_ad_id || '';
      target.interstitial_ad_id = row.interstitial_ad_id || '';
      target.rewarded_ad_id = row.rewarded_ad_id || '';
      target.app_open_ad_id = row.app_open_ad_id || '';
      target.native_ad_id = row.native_ad_id || '';
    }
  });

  // 3. Fetch ad format and behavioral settings
  const settingsRes = await executor.query(
    'SELECT banner_enabled, interstitial_enabled, rewarded_enabled, app_open_enabled, native_enabled, interstitial_frequency, rewarded_coins FROM google_ads_settings WHERE config_id = 1 LIMIT 1'
  );

  const adSettings = {
    banner_enabled: true,
    interstitial_enabled: true,
    rewarded_enabled: true,
    app_open_enabled: true,
    native_enabled: true,
    interstitial_frequency: 3,
    rewarded_coins: 25
  };

  if (settingsRes.rows.length > 0) {
    const s = settingsRes.rows[0];
    adSettings.banner_enabled = Boolean(s.banner_enabled);
    adSettings.interstitial_enabled = Boolean(s.interstitial_enabled);
    adSettings.rewarded_enabled = Boolean(s.rewarded_enabled);
    adSettings.app_open_enabled = Boolean(s.app_open_enabled);
    adSettings.native_enabled = Boolean(s.native_enabled);
    adSettings.interstitial_frequency = Number(s.interstitial_frequency);
    adSettings.rewarded_coins = Number(s.rewarded_coins);
  }

  return {
    ads_enabled: Boolean(mainConfig.ads_enabled),
    test_mode: Boolean(mainConfig.test_mode),
    android: androidConfig,
    ios: iosConfig,
    ad_settings: adSettings
  };
}

/**
 * Updates the configuration within a PostgreSQL transaction.
 * Preserves existing values if not specified in the payload.
 */
async function updateGoogleAdsConfig(payload) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Lock and fetch current configuration to merge partial updates safely
    const currentConfig = await getFullGoogleAdsConfig(client);

    // Merge General Settings
    const newAdsEnabled = payload.ads_enabled !== undefined ? parseBoolean(payload.ads_enabled) : currentConfig.ads_enabled;
    const newTestMode = payload.test_mode !== undefined ? parseBoolean(payload.test_mode) : currentConfig.test_mode;

    await client.query(
      `UPDATE google_ads_config 
       SET ads_enabled = $1, test_mode = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = 1`,
      [newAdsEnabled, newTestMode]
    );

    // Merge Android Platform Settings
    if (payload.android && typeof payload.android === 'object') {
      const a = payload.android;
      const androidAppId = a.app_id !== undefined ? String(a.app_id).trim() : currentConfig.android.app_id;
      const androidBannerId = a.banner_ad_id !== undefined ? String(a.banner_ad_id).trim() : currentConfig.android.banner_ad_id;
      const androidInterstitialId = a.interstitial_ad_id !== undefined ? String(a.interstitial_ad_id).trim() : currentConfig.android.interstitial_ad_id;
      const androidRewardedId = a.rewarded_ad_id !== undefined ? String(a.rewarded_ad_id).trim() : currentConfig.android.rewarded_ad_id;
      const androidAppOpenId = a.app_open_ad_id !== undefined ? String(a.app_open_ad_id).trim() : currentConfig.android.app_open_ad_id;
      const androidNativeId = a.native_ad_id !== undefined ? String(a.native_ad_id).trim() : currentConfig.android.native_ad_id;

      await client.query(
        `UPDATE google_ads_platform_config 
         SET app_id = $1, banner_ad_id = $2, interstitial_ad_id = $3, rewarded_ad_id = $4, app_open_ad_id = $5, native_ad_id = $6, updated_at = CURRENT_TIMESTAMP 
         WHERE config_id = 1 AND platform = 'android'`,
        [androidAppId, androidBannerId, androidInterstitialId, androidRewardedId, androidAppOpenId, androidNativeId]
      );
    }

    // Merge iOS Platform Settings
    if (payload.ios && typeof payload.ios === 'object') {
      const i = payload.ios;
      const iosAppId = i.app_id !== undefined ? String(i.app_id).trim() : currentConfig.ios.app_id;
      const iosBannerId = i.banner_ad_id !== undefined ? String(i.banner_ad_id).trim() : currentConfig.ios.banner_ad_id;
      const iosInterstitialId = i.interstitial_ad_id !== undefined ? String(i.interstitial_ad_id).trim() : currentConfig.ios.interstitial_ad_id;
      const iosRewardedId = i.rewarded_ad_id !== undefined ? String(i.rewarded_ad_id).trim() : currentConfig.ios.rewarded_ad_id;
      const iosAppOpenId = i.app_open_ad_id !== undefined ? String(i.app_open_ad_id).trim() : currentConfig.ios.app_open_ad_id;
      const iosNativeId = i.native_ad_id !== undefined ? String(i.native_ad_id).trim() : currentConfig.ios.native_ad_id;

      await client.query(
        `UPDATE google_ads_platform_config 
         SET app_id = $1, banner_ad_id = $2, interstitial_ad_id = $3, rewarded_ad_id = $4, app_open_ad_id = $5, native_ad_id = $6, updated_at = CURRENT_TIMESTAMP 
         WHERE config_id = 1 AND platform = 'ios'`,
        [iosAppId, iosBannerId, iosInterstitialId, iosRewardedId, iosAppOpenId, iosNativeId]
      );
    }

    // Merge Ad Settings
    if (payload.ad_settings && typeof payload.ad_settings === 'object') {
      const s = payload.ad_settings;
      const bannerEnabled = s.banner_enabled !== undefined ? parseBoolean(s.banner_enabled) : currentConfig.ad_settings.banner_enabled;
      const interstitialEnabled = s.interstitial_enabled !== undefined ? parseBoolean(s.interstitial_enabled) : currentConfig.ad_settings.interstitial_enabled;
      const rewardedEnabled = s.rewarded_enabled !== undefined ? parseBoolean(s.rewarded_enabled) : currentConfig.ad_settings.rewarded_enabled;
      const appOpenEnabled = s.app_open_enabled !== undefined ? parseBoolean(s.app_open_enabled) : currentConfig.ad_settings.app_open_enabled;
      const nativeEnabled = s.native_enabled !== undefined ? parseBoolean(s.native_enabled) : currentConfig.ad_settings.native_enabled;
      const interstitialFrequency = s.interstitial_frequency !== undefined ? parseInt(s.interstitial_frequency, 10) : currentConfig.ad_settings.interstitial_frequency;
      const rewardedCoins = s.rewarded_coins !== undefined ? parseInt(s.rewarded_coins, 10) : currentConfig.ad_settings.rewarded_coins;

      await client.query(
        `UPDATE google_ads_settings 
         SET banner_enabled = $1, interstitial_enabled = $2, rewarded_enabled = $3, app_open_enabled = $4, native_enabled = $5, interstitial_frequency = $6, rewarded_coins = $7, updated_at = CURRENT_TIMESTAMP 
         WHERE config_id = 1`,
        [bannerEnabled, interstitialEnabled, rewardedEnabled, appOpenEnabled, nativeEnabled, interstitialFrequency, rewardedCoins]
      );
    }

    await client.query('COMMIT');

    // Return the updated data structure
    return await getFullGoogleAdsConfig();
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getFullGoogleAdsConfig,
  updateGoogleAdsConfig
};
