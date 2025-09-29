import express from "express";
import jwt from "jsonwebtoken";
import User from "../user/user.model.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ where: { username } });
  if (!user) return res.status(400).json({ error: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: "Invalid password" });

  // Attach user info inside JWT
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({ token, role: user.role });
});

export default router;
