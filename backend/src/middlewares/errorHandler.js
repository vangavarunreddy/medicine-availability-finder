/**
 * Centralized Error Handling Middleware
 * Guarantees standard error format across all APIs:
 * { "success": false, "message": "...", "error": "..." }
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errorDetails = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(errorDetails && { error: errorDetails })
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
};
