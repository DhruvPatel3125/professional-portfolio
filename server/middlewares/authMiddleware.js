import { config } from '../config/env.js';

export function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized. Authorization header is missing.' });
    }

    // Support both "Bearer <token>" and raw "<token>"
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7).trim() 
      : authHeader.trim();

    if (!config.ADMIN_SECRET) {
      return res.status(500).json({ error: 'Admin authentication is misconfigured on the server.' });
    }

    if (token !== config.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Forbidden. Invalid Admin Key passcode.' });
    }

    next();
  } catch (error) {
    console.error('[AuthMiddleware] Verification error:', error);
    res.status(500).json({ error: 'Internal server error validating credentials.' });
  }
}
