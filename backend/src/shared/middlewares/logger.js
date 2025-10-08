import winston from "winston";
import path from "path";

// Create logs directory if it doesn't exist
import fs from "fs";
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Configure winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Write all logs to console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      silent: process.env.NODE_ENV === "production",
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write error logs to error.log
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Request logger middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info({
    type: "request",
    method: req.method,
    url: req.url,
    ip: req.ip,
    user: req.user?.username || "anonymous",
  });

  // Log response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - start;
    logger.info({
      type: "response",
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      user: req.user?.username || "anonymous",
    });
    originalSend.call(this, data);
  };

  next();
};

// Error logger
export const errorLogger = (err, req, res, next) => {
  logger.error({
    type: "error",
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack,
    user: req.user?.username || "anonymous",
  });
  next(err);
};

export default logger;
