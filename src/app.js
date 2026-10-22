const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
require('dotenv').config();

const { ensureCsrfToken, requireAdminPage, redirectIfLoggedIn } = require('./middleware/auth');
const adminAuthRoutes = require('./routes/adminAuth');
const adminAdsRoutes = require('./routes/adminAds');
const publicAdsRoutes = require('./routes/publicAds');

const app = express();

// Security HTTP headers (disable CSP restrictive directive to allow Bootstrap CDNs)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session configuration
const isProd = process.env.NODE_ENV === 'production';
app.use(
  session({
    name: 'slide_solve_sid',
    secret: process.env.SESSION_SECRET || 'fallback_development_session_secret_32_chars',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Ensure a CSRF token is tied to every active session
app.use(ensureCsrfToken);

// Serve static assets for Admin Panel
app.use('/admin/css', express.static(path.join(__dirname, '..', 'public', 'admin', 'css')));
app.use('/admin/js', express.static(path.join(__dirname, '..', 'public', 'admin', 'js')));

// ==============================================================================
// Admin HTML Pages (Protected & Public Views)
// ==============================================================================
app.get('/admin', (req, res) => {
  if (req.session && req.session.adminUser) {
    return res.redirect('/admin/dashboard');
  }
  return res.redirect('/admin/login');
});

app.get('/admin/login', redirectIfLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'login.html'));
});

app.get('/admin/dashboard', requireAdminPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'dashboard.html'));
});

app.get('/admin/google-ads', requireAdminPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'google-ads.html'));
});

// ==============================================================================
// API Endpoints
// ==============================================================================
// 1. Admin Authentication: /api/v1/admin/login, /api/v1/admin/logout, /api/v1/admin/me
app.use('/api/v1/admin', adminAuthRoutes);

// 2. Admin Ads Config: GET /api/v1/admin/google-ads, PUT /api/v1/admin/google-ads
app.use('/api/v1/admin', adminAdsRoutes);

// 3. Public Mobile Ads Config: GET /api/v1/config/google-ads
app.use('/api/v1/config', publicAdsRoutes);

// ==============================================================================
// Existing Static Website & Game Assets
// ==============================================================================
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..')));

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `API endpoint '${req.originalUrl}' does not exist.`
  });
});

module.exports = app;
