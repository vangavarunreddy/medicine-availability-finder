import { verifyToken } from '../utils/jwt.js';
import { query } from '../config/db.js';

/**
 * Middleware to authenticate requests via JWT Bearer Token
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token required.'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }

  try {
    // Fetch active user profile from database
    const userResult = await query(
      `SELECT u.id, u.email, u.role, u.full_name, u.phone, u.is_email_verified, 
              v.id as vendor_id, v.business_name, v.vendor_type, v.status as vendor_status
       FROM users u
       LEFT JOIN vendors v ON v.user_id = u.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated user account no longer exists.'
      });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      error: error.message
    });
  }
};

/**
 * Middleware to restrict route access to specific roles
 * @param {...string} allowedRoles - 'PATIENT', 'PHARMACY', 'MEDICAL_AGENCY', 'ADMIN'
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden. Requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};
