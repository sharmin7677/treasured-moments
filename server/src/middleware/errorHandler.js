export function errorHandler(error, req, res, next) {
  console.error('API Error:', error);

  res.status(error.status || 500).json({
    status: 'error',
    message: error.message || 'Internal server error',
  });
}