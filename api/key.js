const crypto = require('crypto');

/**
 * Constant-time comparison between two strings to prevent timing attacks.
 */
function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = (req, res) => {
  // CORS configuration (allow requests from web apps, mobile apps, Postman)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-api-token'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Allow only GET and POST methods
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      message: 'Only GET and POST requests are supported.'
    });
  }

  // Static Token and Static Key from environment variables (or secure fallback defaults)
  const expectedToken = process.env.STATIC_AUTH_TOKEN || 'your_secret_auth_token_here';
  const secretKey = process.env.STATIC_SECRET_KEY || 'your_secret_static_key_here';

  // Extract token from standard 'Authorization: Bearer <token>' header or 'x-api-token'
  let clientToken = null;
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      clientToken = authHeader.slice(7).trim();
    } else {
      clientToken = authHeader.trim();
    }
  } else if (req.headers['x-api-token']) {
    clientToken = req.headers['x-api-token'];
  }

  // 1. Missing Token validation
  if (!clientToken) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication token missing. Please provide `Authorization: Bearer <TOKEN>` in the headers.'
    });
  }

  // 2. Token Matching check
  if (!secureCompare(clientToken, expectedToken)) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Invalid authorization token.'
    });
  }

  // 3. Token matched - return the static key securely
  return res.status(200).json({
    success: true,
    data: {
      key: secretKey
    }
  });
};
