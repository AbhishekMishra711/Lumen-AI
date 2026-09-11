const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lumen_default_secret_jwt_2026';

/**
 * Universal Resolver for userId across Body, Headers, Cookies, and JWT Tokens
 */
function resolveUserId(req) {
  if (!req) return null;

  // 1. Explicit userId in Request Body
  if (
    req.body &&
    req.body.userId &&
    String(req.body.userId).trim() !== '' &&
    req.body.userId !== 'null' &&
    req.body.userId !== 'undefined'
  ) {
    return String(req.body.userId).trim();
  }

  // 2. Custom header: x-user-id
  const headerUserId =
    req.headers && (req.headers['x-user-id'] || req.headers['X-User-Id']);
  if (
    headerUserId &&
    String(headerUserId).trim() !== '' &&
    headerUserId !== 'null' &&
    headerUserId !== 'undefined'
  ) {
    return String(headerUserId).trim();
  }

  // 3. Query string parameter: ?userId=...
  if (
    req.query &&
    req.query.userId &&
    String(req.query.userId).trim() !== '' &&
    req.query.userId !== 'null' &&
    req.query.userId !== 'undefined'
  ) {
    return String(req.query.userId).trim();
  }

  // 4. JWT Authorization Header: Bearer <token>
  const authHeader =
    req.headers && (req.headers.authorization || req.headers.Authorization);
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && (decoded.id || decoded.userId || decoded._id)) {
        return String(decoded.id || decoded.userId || decoded._id);
      }
    } catch (e) {
      // Invalid or expired token
    }
  }

  // 5. Parse Cookie header (lumen_user_id, lumen_user, lumen_token)
  if (req.headers && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, c) => {
      const parts = c.trim().split('=');
      if (parts[0]) {
        acc[parts[0]] = decodeURIComponent(parts.slice(1).join('='));
      }
      return acc;
    }, {});

    if (cookies.lumen_user_id && cookies.lumen_user_id !== 'null') {
      return String(cookies.lumen_user_id).trim();
    }

    if (cookies.lumen_user) {
      try {
        const u = JSON.parse(cookies.lumen_user);
        if (u && (u.id || u._id)) {
          return String(u.id || u._id);
        }
      } catch (e) {}
    }

    if (cookies.lumen_token) {
      try {
        const decoded = jwt.verify(cookies.lumen_token, JWT_SECRET);
        if (decoded && (decoded.id || decoded.userId || decoded._id)) {
          return String(decoded.id || decoded.userId || decoded._id);
        }
      } catch (e) {}
    }
  }

  return null;
}

module.exports = {
  resolveUserId,
};
