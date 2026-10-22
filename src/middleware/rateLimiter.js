const rateLimit = require('express-rate-limit');

// Rate limiter for admin login endpoint to prevent brute-force attacks
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 login requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many login attempts from this IP address. Please try again after 15 minutes.'
  }
});

// General API rate limiter for public endpoints
const publicApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // limit each IP to 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many requests. Please slow down.'
  }
});

module.exports = {
  loginRateLimiter,
  publicApiLimiter
};
