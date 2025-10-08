// auth.js
import jwt from "jsonwebtoken";
import { roles } from "../../config/roles.js";

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const authorize = (action) => {
  return (req, res, next) => {
    const role = req.user?.role;
    const permissions = roles[role]?.can;

    if (!permissions || !permissions.includes(action)) {
      return res.status(403).json({ error: "Access Forbidden" });
    }

    next();
  };
};
