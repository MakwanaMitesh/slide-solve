-- ============================================================================
-- PostgreSQL Database Schema for Google Ads Remote Configuration & Admin Panel
-- ============================================================================

-- 1. Admin Users Table
-- Stores administrator credentials, secure bcrypt password hashes, and timestamps.
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(LOWER(username));

-- 2. Google Ads Main Configuration Table (General Settings)
-- Manages global master switches: ads_enabled and test_mode.
CREATE TABLE IF NOT EXISTS google_ads_config (
    id SERIAL PRIMARY KEY,
    ads_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    test_mode BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Google Ads Platform Configuration Table (Android & iOS)
-- Stores separate ad unit IDs and application IDs for each mobile platform.
CREATE TABLE IF NOT EXISTS google_ads_platform_config (
    id SERIAL PRIMARY KEY,
    config_id INT NOT NULL REFERENCES google_ads_config(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('android', 'ios')),
    app_id VARCHAR(255) NOT NULL DEFAULT '',
    banner_ad_id VARCHAR(255) NOT NULL DEFAULT '',
    interstitial_ad_id VARCHAR(255) NOT NULL DEFAULT '',
    rewarded_ad_id VARCHAR(255) NOT NULL DEFAULT '',
    app_open_ad_id VARCHAR(255) NOT NULL DEFAULT '',
    native_ad_id VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_platform_config UNIQUE (config_id, platform)
);

-- 4. Google Ads Ad Format & Behavioral Settings Table
-- Stores toggles per ad format and game/app numeric parameters (frequency & reward coins).
CREATE TABLE IF NOT EXISTS google_ads_settings (
    id SERIAL PRIMARY KEY,
    config_id INT NOT NULL REFERENCES google_ads_config(id) ON DELETE CASCADE,
    banner_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    interstitial_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    rewarded_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    app_open_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    native_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    interstitial_frequency INT NOT NULL DEFAULT 3 CHECK (interstitial_frequency >= 1),
    rewarded_coins INT NOT NULL DEFAULT 25 CHECK (rewarded_coins >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_config_settings UNIQUE (config_id)
);

-- ============================================================================
-- Default Initial Configuration Seed (Only if config record #1 does not exist)
-- ============================================================================

-- Default to ads disabled (false) and test mode enabled (true)
INSERT INTO google_ads_config (id, ads_enabled, test_mode)
VALUES (1, FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Default Android IDs record
INSERT INTO google_ads_platform_config (config_id, platform, app_id, banner_ad_id, interstitial_ad_id, rewarded_ad_id, app_open_ad_id, native_ad_id)
VALUES (1, 'android', '', '', '', '', '', '')
ON CONFLICT (config_id, platform) DO NOTHING;

-- Default iOS IDs record
INSERT INTO google_ads_platform_config (config_id, platform, app_id, banner_ad_id, interstitial_ad_id, rewarded_ad_id, app_open_ad_id, native_ad_id)
VALUES (1, 'ios', '', '', '', '', '', '')
ON CONFLICT (config_id, platform) DO NOTHING;

-- Default format settings and numeric parameters
INSERT INTO google_ads_settings (config_id, banner_enabled, interstitial_enabled, rewarded_enabled, app_open_enabled, native_enabled, interstitial_frequency, rewarded_coins)
VALUES (1, TRUE, TRUE, TRUE, TRUE, TRUE, 3, 25)
ON CONFLICT (config_id) DO NOTHING;
