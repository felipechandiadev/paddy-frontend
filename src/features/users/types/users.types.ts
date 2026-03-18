export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CONSULTANT';
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  timestamp: string;
}

export interface PermissionOverride {
  permissionKey: string;
  effect: 'GRANT' | 'REVOKE';
}

export interface UserPermissionsData {
  effective: string[];
  overrides: PermissionOverride[];
}
