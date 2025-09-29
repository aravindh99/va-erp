// src/service/auth.js
import { jwtDecode } from "jwt-decode";

// Get user role from JWT token
export const getUserRole = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    
    const decoded = jwtDecode(token);
    return decoded.role;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

// Check if user has specific permission
export const hasPermission = (permission) => {
  const role = getUserRole();
  
  const rolePermissions = {
    admin: ["create", "read", "update", "delete", "manageUsers"],
    editor: ["create", "read", "update", "delete"],
    viewer: ["create", "read"]
  };
  
  return rolePermissions[role]?.includes(permission) || false;
};

// Check if user can edit/delete
export const canEdit = () => hasPermission("update");
export const canDelete = () => hasPermission("delete");
export const canManageUsers = () => {
  const username = getUsername();
  return username === "admin";
};

// Get username from JWT token
export const getUsername = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const decoded = jwtDecode(token);
    return decoded.username || decoded.user?.username || decoded.name || null;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};