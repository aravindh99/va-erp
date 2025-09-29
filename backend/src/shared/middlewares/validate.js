export const validate = (schema) => {
  return (req, res, next) => {
    try {
      console.log(
        "🔍 Validating request body:",
        JSON.stringify(req.body, null, 2)
      );

      const result = schema.safeParse(req.body);

      if (!result.success) {
        console.error("❌ Validation failed:", result.error);
        const errors = result.error.errors || result.error.issues || [];
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.map((err) => ({
            field: err.path?.join(".") || err.field || "unknown",
            message: err.message,
            received: err.received,
          })),
        });
      }

      console.log("✅ Validation passed");
      req.body = result.data;
      next();
    } catch (error) {
      console.error("💥 Validation middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal validation error",
        error: error.message,
      });
    }
  };
};
