import { ZodError } from "zod";
import { ValidationError } from "sequelize";

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  let statusCode = 500;
  let message = "Server Error";
  let errors = [];

  // Zod validation error
  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
  }
  // Sequelize validation error
  else if (err instanceof ValidationError) {
    statusCode = 400;
    message = "Database validation failed";
    errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }
  // Custom error with status
  else if (err.status) {
    statusCode = err.status;
    message = err.message;
  }
  // Fallback for generic Error
  else if (err.message) {
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
  });
};
