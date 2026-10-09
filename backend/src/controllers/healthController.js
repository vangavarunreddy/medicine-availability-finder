import { checkDbConnection } from '../config/db.js';

/**
 * Basic Health Check Controller
 */
export const checkHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Medicine Availability Finder API Service is operational',
    data: {
      status: 'healthy',
      service: 'medicine-availability-finder-api',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
  });
};

/**
 * Database Connectivity Health Check Controller
 */
export const checkDbHealth = async (req, res) => {
  const connStatus = await checkDbConnection();

  if (connStatus.connected) {
    return res.status(200).json({
      success: true,
      message: connStatus.message,
      data: {
        database: connStatus.database,
        serverTime: connStatus.serverTime,
        latencyMs: connStatus.latencyMs
      }
    });
  }

  return res.status(503).json({
    success: false,
    message: connStatus.message,
    error: connStatus.error || 'Database unavailable'
  });
};
