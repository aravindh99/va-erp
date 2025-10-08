// validateRequest.js
// Generic Zod validator middleware for request bodies
export const validateRequest = (schema) => {
  return (req, res, next) => {
    if (!schema) {
      return next();
    }

    const parseResult = schema.safeParse(req.body);
    if (parseResult.success) {
      // replace body with parsed data to ensure correct types
      req.body = parseResult.data;
      return next();
    }

    const errors = parseResult.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  };
};


