const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Prisma errors
  if (err.code === 'P2002') {
    error.message = 'Duplicate entry found';
    error.status = 400;
  }

  if (err.code === 'P2025') {
    error.message = 'Record not found';
    error.status = 404;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    error.status = 400;
    error.details = err.details;
  }

  // Development vs Production error responses
  const response = {
    error: error.message,
    status: error.status,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  res.status(error.status).json(response);
};

module.exports = errorHandler; 