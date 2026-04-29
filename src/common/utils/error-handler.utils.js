// src/common/middleware/error-handler.middleware.js
import { ZodError } from 'zod';
import ApiError from './api-error.utils.js';

const errorHandler = (err, req, res, next) => {

  //  our custom ApiError — || isOperational se pehchano
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Zod validation error
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "validation error",
      errors: err.errors,
    });
  }

  // unexpected error
  console.error(err);
  return res.status(500).json({
    success: false,
    message: "internal server error",
  });
};

export default errorHandler;
