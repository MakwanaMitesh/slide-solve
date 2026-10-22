const crypto = require('crypto');

/**
 * Ensures a CSRF token exists for the active session.
 */
function ensureCsrfToken(req, res, next) {
  if (req.session && !req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  next();
}

/**
 * Middleware to require admin authentication for API endpoints.
 */
function requireAdminApi(req, res, next) {
  if (!req.session || !req.session.adminUser) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required. Please log in to access this resource.'
    });
  }
  next();
}

/**
 * Middleware to verify CSRF token on state-changing requests.
 */
function verifyCsrfToken(req, res, next) {
  // Safe HTTP methods do not require CSRF verification
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Exempt public endpoints or login (which establishes the session)
  if (req.path === '/api/v1/admin/login' || req.path.startsWith('/api/v1/config/')) {
    return next();
  }

  const clientToken = req.headers['x-csrf-token'] || (req.body && req.body._csrf);
  const sessionToken = req.session ? req.session.csrfToken : null;

  if (!sessionToken || !clientToken || clientToken !== sessionToken) {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF Token',
      message: 'Security validation failed (CSRF token missing or mismatch). Please refresh the page.'
    });
  }

  next();
}

/**
 * Middleware to protect HTML admin pages (redirects to /admin/login if not logged in).
 */
function requireAdminPage(req, res, next) {
  if (!req.session || !req.session.adminUser) {
    return res.redirect('/admin/login');
  }
  next();
}

/**
 * Middleware for the login page (redirects to /admin/google-ads if already logged in).
 */
function redirectIfLoggedIn(req, res, next) {
  if (req.session && req.session.adminUser) {
    return res.redirect('/admin/dashboard');
  }
  next();
}

module.exports = {
  ensureCsrfToken,
  requireAdminApi,
  verifyCsrfToken,
  requireAdminPage,
  redirectIfLoggedIn
};
