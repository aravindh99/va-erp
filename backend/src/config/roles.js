export const roles = {
  admin: {
    can: ["create", "read", "update", "delete", "manageUsers"],
  },
  editor: {
    can: ["create", "read", "update", "delete"],
  },
  viewer: {
    can: ["create", "read"],
  },
};
