// ==============================================================================
// Google Ads Configuration Manager
// ==============================================================================

let currentConfig = null;
let originalConfig = null;
let csrfToken = null;

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('adsConfigForm');
  const btnSave = document.getElementById('btnSaveConfig');
  const btnReset = document.getElementById('btnResetConfig');
  const btnRefresh = document.getElementById('btnRefreshConfig');

  // Initialize Toast
  const toastEl = document.getElementById('actionToast');
  const toastMessage = document.getElementById('toastMessage');
  const toastTitle = document.getElementById('toastTitle');
  const toastIcon = document.getElementById('toastIcon');
  const toast = new bootstrap.Toast(toastEl, { delay: 4000 });

  function showNotification(type, title, message) {
    toastEl.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning', 'text-bg-info');
    if (type === 'success') {
      toastEl.classList.add('text-bg-success');
      toastIcon.className = 'bi bi-check-circle-fill me-2';
    } else if (type === 'danger') {
      toastEl.classList.add('text-bg-danger');
      toastIcon.className = 'bi bi-exclamation-triangle-fill me-2';
    } else {
      toastEl.classList.add('text-bg-info');
      toastIcon.className = 'bi bi-info-circle-fill me-2';
    }
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    toast.show();
  }

  // 1. Fetch CSRF token and user profile
  async function fetchCsrfToken() {
    try {
      const res = await fetch('/api/v1/admin/me');
      if (res.ok) {
        const data = await res.json();
        if (data.csrfToken) {
          csrfToken = data.csrfToken;
        }
      }
    } catch (err) {
      console.warn('Could not fetch CSRF token:', err);
    }
  }

  // 2. Load Google Ads settings from database
  async function loadConfig() {
    try {
      setLoadingState(true);
      const res = await fetch('/api/v1/admin/google-ads');
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const responseData = await res.json();
      if (!responseData.success || !responseData.data) {
        throw new Error(responseData.message || 'Failed to load configuration');
      }

      currentConfig = responseData.data;
      originalConfig = JSON.parse(JSON.stringify(currentConfig));

      populateForm(currentConfig);
      updateStatusBadges(currentConfig);
      updateJsonPreview(currentConfig);
    } catch (err) {
      console.error('Error loading config:', err);
      showNotification('danger', 'Load Error', 'Failed to fetch configuration from database. ' + err.message);
    } finally {
      setLoadingState(false);
    }
  }

  function setLoadingState(isLoading) {
    if (btnSave) btnSave.disabled = isLoading;
    if (btnReset) btnReset.disabled = isLoading;
    if (btnRefresh) {
      const icon = btnRefresh.querySelector('i');
      if (icon) {
        if (isLoading) icon.classList.add('bi-spin');
        else icon.classList.remove('bi-spin');
      }
    }
  }

  // 3. Populate form fields
  function populateForm(data) {
    // General Settings
    document.getElementById('ads_enabled').checked = Boolean(data.ads_enabled);
    document.getElementById('test_mode').checked = Boolean(data.test_mode);

    // Android Settings
    const android = data.android || {};
    document.getElementById('android_app_id').value = android.app_id || '';
    document.getElementById('android_banner_ad_id').value = android.banner_ad_id || '';
    document.getElementById('android_interstitial_ad_id').value = android.interstitial_ad_id || '';
    document.getElementById('android_rewarded_ad_id').value = android.rewarded_ad_id || '';
    document.getElementById('android_app_open_ad_id').value = android.app_open_ad_id || '';
    document.getElementById('android_native_ad_id').value = android.native_ad_id || '';

    // iOS Settings
    const ios = data.ios || {};
    document.getElementById('ios_app_id').value = ios.app_id || '';
    document.getElementById('ios_banner_ad_id').value = ios.banner_ad_id || '';
    document.getElementById('ios_interstitial_ad_id').value = ios.interstitial_ad_id || '';
    document.getElementById('ios_rewarded_ad_id').value = ios.rewarded_ad_id || '';
    document.getElementById('ios_app_open_ad_id').value = ios.app_open_ad_id || '';
    document.getElementById('ios_native_ad_id').value = ios.native_ad_id || '';

    // Ad Settings
    const settings = data.ad_settings || {};
    document.getElementById('banner_enabled').checked = Boolean(settings.banner_enabled);
    document.getElementById('interstitial_enabled').checked = Boolean(settings.interstitial_enabled);
    document.getElementById('rewarded_enabled').checked = Boolean(settings.rewarded_enabled);
    document.getElementById('app_open_enabled').checked = Boolean(settings.app_open_enabled);
    document.getElementById('native_enabled').checked = Boolean(settings.native_enabled);
    document.getElementById('interstitial_frequency').value = settings.interstitial_frequency ?? 3;
    document.getElementById('rewarded_coins').value = settings.rewarded_coins ?? 25;
  }

  // 4. Collect Form Data into Structured Payload
  function collectFormData() {
    return {
      ads_enabled: document.getElementById('ads_enabled').checked,
      test_mode: document.getElementById('test_mode').checked,
      android: {
        app_id: document.getElementById('android_app_id').value.trim(),
        banner_ad_id: document.getElementById('android_banner_ad_id').value.trim(),
        interstitial_ad_id: document.getElementById('android_interstitial_ad_id').value.trim(),
        rewarded_ad_id: document.getElementById('android_rewarded_ad_id').value.trim(),
        app_open_ad_id: document.getElementById('android_app_open_ad_id').value.trim(),
        native_ad_id: document.getElementById('android_native_ad_id').value.trim()
      },
      ios: {
        app_id: document.getElementById('ios_app_id').value.trim(),
        banner_ad_id: document.getElementById('ios_banner_ad_id').value.trim(),
        interstitial_ad_id: document.getElementById('ios_interstitial_ad_id').value.trim(),
        rewarded_ad_id: document.getElementById('ios_rewarded_ad_id').value.trim(),
        app_open_ad_id: document.getElementById('ios_app_open_ad_id').value.trim(),
        native_ad_id: document.getElementById('ios_native_ad_id').value.trim()
      },
      ad_settings: {
        banner_enabled: document.getElementById('banner_enabled').checked,
        interstitial_enabled: document.getElementById('interstitial_enabled').checked,
        rewarded_enabled: document.getElementById('rewarded_enabled').checked,
        app_open_enabled: document.getElementById('app_open_enabled').checked,
        native_enabled: document.getElementById('native_enabled').checked,
        interstitial_frequency: parseInt(document.getElementById('interstitial_frequency').value, 10) || 1,
        rewarded_coins: parseInt(document.getElementById('rewarded_coins').value, 10) || 0
      }
    };
  }

  // 5. Update Status Badges in Top Header
  function updateStatusBadges(data) {
    const adsStatusBadge = document.getElementById('adsStatusBadge');
    const testModeBadge = document.getElementById('testModeBadge');

    if (adsStatusBadge) {
      if (data.ads_enabled) {
        adsStatusBadge.className = 'badge-status badge-live';
        adsStatusBadge.innerHTML = '<span class="status-dot active"></span> Ads Active';
      } else {
        adsStatusBadge.className = 'badge-status badge-disabled';
        adsStatusBadge.innerHTML = '<span class="status-dot inactive"></span> Ads Disabled';
      }
    }

    if (testModeBadge) {
      if (data.test_mode) {
        testModeBadge.className = 'badge-status badge-test';
        testModeBadge.innerHTML = '<i class="bi bi-shield-check"></i> Test Mode ON';
      } else {
        testModeBadge.className = 'badge-status badge-live';
        testModeBadge.innerHTML = '<i class="bi bi-broadcast"></i> Production Mode';
      }
    }
  }

  // 6. Update Live JSON Preview Box
  function updateJsonPreview(data) {
    const previewEl = document.getElementById('jsonPreview');
    if (previewEl) {
      const fullResponse = {
        success: true,
        message: 'Google Ads configuration fetched successfully',
        data: data
      };
      previewEl.textContent = JSON.stringify(fullResponse, null, 2);
    }
  }

  // Listen to input changes to update preview live
  if (form) {
    form.addEventListener('input', () => {
      const liveData = collectFormData();
      updateStatusBadges(liveData);
      updateJsonPreview(liveData);
    });
  }

  // 7. Save Configuration (PUT /api/v1/admin/google-ads)
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Client-side Validation
      const freq = parseInt(document.getElementById('interstitial_frequency').value, 10);
      const coins = parseInt(document.getElementById('rewarded_coins').value, 10);

      if (isNaN(freq) || freq < 1) {
        showNotification('danger', 'Validation Error', 'Interstitial Frequency must be at least 1.');
        document.getElementById('interstitial_frequency').focus();
        return;
      }

      if (isNaN(coins) || coins < 0) {
        showNotification('danger', 'Validation Error', 'Rewarded Coins cannot be negative.');
        document.getElementById('rewarded_coins').focus();
        return;
      }

      const payload = collectFormData();

      // UI Loading state
      const originalSaveHtml = btnSave.innerHTML;
      btnSave.disabled = true;
      btnSave.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Saving to PostgreSQL...
      `;

      try {
        if (!csrfToken) {
          await fetchCsrfToken();
        }

        const res = await fetch('/api/v1/admin/google-ads', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-Token': csrfToken || ''
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success) {
          currentConfig = data.data;
          originalConfig = JSON.parse(JSON.stringify(currentConfig));
          populateForm(currentConfig);
          updateStatusBadges(currentConfig);
          updateJsonPreview(currentConfig);

          showNotification(
            'success',
            'Configuration Saved',
            'Google Ads configuration successfully updated and committed to PostgreSQL.'
          );
        } else {
          showNotification(
            'danger',
            'Save Failed',
            data.message || 'Could not save configuration. Check inputs and try again.'
          );
        }
      } catch (err) {
        console.error('Save error:', err);
        showNotification('danger', 'Network Error', 'Failed to communicate with server: ' + err.message);
      } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = originalSaveHtml;
      }
    });
  }

  // 8. Reset Changes button
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (!originalConfig) return;
      populateForm(originalConfig);
      updateStatusBadges(originalConfig);
      updateJsonPreview(originalConfig);
      showNotification('info', 'Changes Reverted', 'Form restored to the saved database configuration.');
    });
  }

  // 9. Manual Refresh button
  if (btnRefresh) {
    btnRefresh.addEventListener('click', async () => {
      await loadConfig();
      showNotification('info', 'Refreshed', 'Configuration re-fetched from database.');
    });
  }

  // Initial Load
  await fetchCsrfToken();
  await loadConfig();
});
