import bcrypt from "bcryptjs";
import User from "../modules/user/user.model.js";

export async function seedAdminUser() {
  try {
    const count = await User.count();
    if (count === 0) {
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || "admin123",
        10
      );

      await User.create({
        username: "xtown",
        password: hashedPassword,
        role: "admin",
        createdBy: "system",
      });

    } else {
    }
  } catch (err) {
    console.error("❌ Error seeding admin user:", err);
  }
}
