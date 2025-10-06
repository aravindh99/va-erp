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
    editor: ["create", "read", "update"],
    viewer: ["create", "read"],
  };

  return rolePermissions[role]?.includes(permission) || false;
};

// Role helpers
export const isAdmin = () => getUserRole() === "admin";
export const isEditor = () => getUserRole() === "editor";
export const isViewer = () => getUserRole() === "viewer";

// Special UI-only restriction for username 'xtown'
export const isTownAdmin = () => {
  const username = getUsername();
  return username === "xtown" && isAdmin();
};

// Permission helpers aligned to new policy
export const canCreate = () => isAdmin() || isEditor() || isViewer();
export const canEdit = () => isAdmin() || isEditor();
export const canDelete = () => isAdmin();
export const canManageUsers = () => isAdmin();

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