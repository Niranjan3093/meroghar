import jwt from 'jsonwebtoken';
import { getAppSettings } from '../utils/appSettings.js';

const ALLOWED_PATHS = [
  '/api/health',
  '/api/admin/settings/public',
  '/api/auth/login',
  '/api/auth/verify-email',
  '/api/auth/resend-verification'
];

const isAllowedPath = (path) => ALLOWED_PATHS.some((allowedPath) => path.startsWith(allowedPath));

export const enforceMaintenanceMode = async (req, res, next) => {
  try {
    const settings = await getAppSettings();

    if (!settings.maintenanceMode) {
      return next();
    }

    if (isAllowedPath(req.path)) {
      return next();
    }

    if (req.path.startsWith('/api/admin')) {
      return next();
    }

    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.role === 'admin') {
          return next();
        }
      } catch (_error) {
        // Ignore token parse errors and continue to maintenance response.
      }
    }

    return res.status(503).json({
      success: false,
      maintenanceMode: true,
      message: settings.maintenanceMessage
    });
  } catch (error) {
    return next(error);
  }
};
