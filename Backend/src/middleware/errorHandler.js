import mongoose from "mongoose";

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error("Error Stack:", err.stack);
  console.error("Error Details:", {
    name: err.name,
    message: err.message,
    code: err.code,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user?._id,
  });

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    return res.status(404).json({
      success: false,
      message,
      code: "RESOURCE_NOT_FOUND",
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    return res.status(409).json({
      success: false,
      message,
      code: "DUPLICATE_FIELD",
      field,
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    return res.status(400).json({
      success: false,
      message,
      code: "VALIDATION_ERROR",
      details: Object.values(err.errors).map((val) => ({
        field: val.path,
        message: val.message,
      })),
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
      code: "TOKEN_EXPIRED",
    });
  }

  // Mongoose connection errors
  if (
    err.name === "MongoNetworkError" ||
    err.name === "MongooseServerSelectionError"
  ) {
    return res.status(503).json({
      success: false,
      message: "Database connection error",
      code: "DATABASE_CONNECTION_ERROR",
    });
  }

  // Rate limiting errors
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: "Too many requests, please try again later",
      code: "RATE_LIMIT_EXCEEDED",
    });
  }

  // Default to 500 server error
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error",
    code: error.code || "INTERNAL_ERROR",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  res.status(404).json({
    success: false,
    message: error.message,
    code: "ROUTE_NOT_FOUND",
  });
};

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
