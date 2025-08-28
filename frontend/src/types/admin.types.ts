// Admin panel specific types with strict TypeScript

import { Role, Permission } from './auth.types';

// User management types
export interface UserFilters {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'all';
  isVerified?: boolean;
  isSuperuser?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  superusers: number;
  newUsersThisMonth: number;
  newUsersToday: number;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  is_active?: boolean;
  is_verified?: boolean;
  is_superuser?: boolean;
  roles?: string[];
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  is_active?: boolean;
  is_verified?: boolean;
  is_superuser?: boolean;
  roles?: string[];
}

// Role management types
export interface RoleFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  is_active?: boolean;
  permissions?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
  permissions?: string[];
}

export interface RoleWithUserCount extends Role {
  user_count: number;
}

// Permission management types
export interface PermissionFilters {
  search?: string;
  resource?: string;
  action?: string;
}

export interface CreatePermissionRequest {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface UpdatePermissionRequest {
  name?: string;
  resource?: string;
  action?: string;
  description?: string;
}

export interface PermissionWithRoleCount extends Permission {
  role_count: number;
}

// Audit log types
export interface AuditLogFilters {
  search?: string;
  user_id?: string;
  action?: string;
  resource_type?: string;
  dateFrom?: string;
  dateTo?: string;
  ip_address?: string;
}

export interface AuditLogStats {
  totalLogs: number;
  uniqueUsers: number;
  uniqueActions: number;
  logsToday: number;
  logsThisWeek: number;
  logsThisMonth: number;
  topActions: Array<{
    action: string;
    count: number;
  }>;
  topUsers: Array<{
    user_id: string;
    user_name: string;
    count: number;
  }>;
}

// System settings types
export interface SystemSettings {
  registration_enabled: boolean;
  email_verification_required: boolean;
  password_reset_enabled: boolean;
  max_login_attempts: number;
  lockout_duration: number;
  session_timeout: number;
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_symbols: boolean;
  maintenance_mode: boolean;
  maintenance_message?: string;
}

export interface UpdateSystemSettingsRequest extends Partial<SystemSettings> {}

// Bulk operations types
export interface BulkUserOperation {
  user_ids: string[];
  operation: 'activate' | 'deactivate' | 'verify' | 'unverify' | 'delete' | 'assign_role' | 'remove_role';
  role_id?: string; // Required for assign_role and remove_role operations
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{
    user_id: string;
    error: string;
  }>;
}

// Dashboard analytics types
export interface AdminDashboardStats {
  users: UserStats;
  roles: {
    totalRoles: number;
    activeRoles: number;
    inactiveRoles: number;
  };
  permissions: {
    totalPermissions: number;
    uniqueResources: number;
    uniqueActions: number;
  };
  audit: AuditLogStats;
  system: {
    uptime: number;
    version: string;
    environment: string;
  };
}

// Table sorting and pagination types
export interface TableSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TablePagination {
  page: number;
  size: number;
  total: number;
  pages: number;
}

export interface TableState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: TablePagination;
  sort: TableSort;
  filters: Record<string, unknown>;
}

// Admin action types for audit logging
export const ADMIN_ACTIONS = {
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ACTIVATE: 'user:activate',
  USER_DEACTIVATE: 'user:deactivate',
  USER_VERIFY: 'user:verify',
  USER_ASSIGN_ROLE: 'user:assign_role',
  USER_REMOVE_ROLE: 'user:remove_role',
  ROLE_CREATE: 'role:create',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ROLE_ASSIGN_PERMISSION: 'role:assign_permission',
  ROLE_REMOVE_PERMISSION: 'role:remove_permission',
  PERMISSION_CREATE: 'permission:create',
  PERMISSION_UPDATE: 'permission:update',
  PERMISSION_DELETE: 'permission:delete',
  SETTINGS_UPDATE: 'settings:update',
  BULK_OPERATION: 'bulk:operation',
} as const;

export type AdminAction = typeof ADMIN_ACTIONS[keyof typeof ADMIN_ACTIONS];

// Permission resources for RBAC
export const ADMIN_RESOURCES = {
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  AUDIT_LOGS: 'audit_logs',
  SYSTEM_SETTINGS: 'system_settings',
  DASHBOARD: 'dashboard',
} as const;

export type AdminResource = typeof ADMIN_RESOURCES[keyof typeof ADMIN_RESOURCES];

// Permission actions for RBAC
export const PERMISSION_ACTIONS = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage', // Full access
} as const;

export type PermissionAction = typeof PERMISSION_ACTIONS[keyof typeof PERMISSION_ACTIONS];

// Helper type for generating permission strings
export type AdminPermission = `${AdminResource}:${PermissionAction}`;

// Required admin permissions
export const REQUIRED_ADMIN_PERMISSIONS: Record<string, AdminPermission[]> = {
  DASHBOARD_ACCESS: ['dashboard:read'],
  USER_MANAGEMENT: ['users:read', 'users:create', 'users:update', 'users:delete'],
  ROLE_MANAGEMENT: ['roles:read', 'roles:create', 'roles:update', 'roles:delete'],
  PERMISSION_MANAGEMENT: ['permissions:read', 'permissions:create', 'permissions:update', 'permissions:delete'],
  AUDIT_ACCESS: ['audit_logs:read'],
  SYSTEM_SETTINGS: ['system_settings:read', 'system_settings:update'],
} as const;