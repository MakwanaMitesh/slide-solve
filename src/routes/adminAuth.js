const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query } = require('../db');
const { loginRateLimiter } = require('../middleware/rateLimiter');
const { requireAdminApi } = require('../middleware/auth');

/**
 * POST /api/v1/admin/login
 * Authenticates admin via email or username and password.
 */
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { login, password } = req.body || {};

    if (!login || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Username/email and password are required.'
      });
    }

    const trimmedLogin = String(login).trim().toLowerCase();

    // Query admin user by lowercased username or email
    const result = await query(
      `SELECT id, username, email, password_hash 
       FROM admin_users 
       WHERE LOWER(username) = $1 OR LOWER(email) = $1 
       LIMIT 1`,
      [trimmedLogin]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Authentication Failed',
        message: 'Invalid username/email or password.'
      });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Authentication Failed',
        message: 'Invalid username/email or password.'
      });
    }

    // Set authenticated user in session
    req.session.adminUser = {
      id: admin.id,
      username: admin.username,
      email: admin.email
    };

    // Generate fresh CSRF token
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: admin.id,
        username: admin.username,
        email: admin.email
      },
      csrfToken: req.session.csrfToken
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'An unexpected error occurred during login. Please try again later.',
      details: error.code || null
    });
  }
});

/**
 * POST /api/v1/admin/logout
 * Destroys session and logs the admin out.
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        success: false,
        error: 'Logout Error',
        message: 'Could not log out at this time.'
      });
    }

    res.clearCookie('connect.sid');
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

/**
 * GET /api/v1/admin/me
 * Returns current authenticated admin profile and CSRF token.
 */
router.get('/me', requireAdminApi, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.session.adminUser,
    csrfToken: req.session.csrfToken
  });
});

module.exports = router;
