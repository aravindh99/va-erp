import { Router } from "express";
import { UserController } from "./user.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import { authorize } from "../../shared/middlewares/auth.js";
import {
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
} from "./user.zod.js";

const router = Router();
const userController = new UserController();

// Only admin can manage users
router.post(
  "/",
  authorize("manageUsers"),
  validate(createUserSchema),
  userController.create
);
router.get("/", authorize("manageUsers"), userController.getAll);
router.get("/:id", authorize("manageUsers"), userController.getById);
router.put(
  "/:id",
  authorize("manageUsers"),
  validate(updateUserSchema),
  userController.update
);
router.delete(
  "/:id",
  authorize("manageUsers"),
  validate(deleteUserSchema),
  userController.softDelete
);
router.delete("/:id/hard", authorize("manageUsers"), userController.hardDelete);
router.post("/:id/restore", authorize("manageUsers"), userController.restore);

export default router;
