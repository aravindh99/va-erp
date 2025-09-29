import User from "./user.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";
import bcrypt from "bcryptjs";

// 1. Create CRUD service from model
const UserCrud = new BaseCrud(User);

// 2. Custom User Controller extending BaseController
export class UserController extends BaseController {
  constructor() {
    super(UserCrud, "User");
  }

  // Override create method to hash password
  create = async (req, res, next) => {
    try {
      const { password, ...userData } = req.body;
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Add user info from JWT token
      const finalUserData = {
        ...userData,
        password: hashedPassword,
        createdBy: req.user.username,
      };
      
      const user = await this.service.create(finalUserData);
      
      // Remove password from response
      const { password: _, ...userResponse } = user.toJSON();
      
      return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: userResponse,
      });
    } catch (error) {
      next(error);
    }
  };

  // Override update method to handle password hashing
  update = async (req, res, next) => {
    try {
      const { password, ...userData } = req.body;
      
      // Add user info from JWT token
      const finalUserData = {
        ...userData,
        updatedBy: req.user.username,
      };
      
      // Hash password if provided
      if (password) {
        finalUserData.password = await bcrypt.hash(password, 10);
      }
      
      const user = await this.service.update(req.params.id, finalUserData);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      
      // Remove password from response
      const { password: _, ...userResponse } = user.toJSON();
      
      return res.json({
        success: true,
        message: "User updated successfully",
        data: userResponse,
      });
    } catch (error) {
      next(error);
    }
  };

  // Override getAll to exclude passwords
  getAll = async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const items = await this.service.getAll(page, limit, {
        attributes: { exclude: ['password'] }
      });
      return res.json({ success: true, ...items });
    } catch (error) {
      next(error);
    }
  };

  // Override getById to exclude password
  getById = async (req, res, next) => {
    try {
      const user = await this.service.getById(req.params.id, {
        attributes: { exclude: ['password'] }
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      return res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  // Override softDelete to handle deletedBy
  softDelete = async (req, res, next) => {
    try {
      // Automatically add user info from JWT token
      const userData = {
        deletedBy: req.user.username, // Store username from JWT token
      };
      
      const item = await this.service.softDelete(req.params.id, userData);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      return res.json({
        success: true,
        message: "User soft deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
