import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 1000, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // return rate limit info in the RateLimit-* headers
  legacyHeaders: false, // disable the X-RateLimit-* headers
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});
