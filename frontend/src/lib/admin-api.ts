// Admin API client with comprehensive CRUD operations and strict typing

import apiClient from './api-client';
import {
  User,
  Role,
  Permission,
  AuditLog,
  ApiResponse,
  PaginatedResponse,
} from '@/types';
import {
  UserFilters,
  UserStats,
  CreateUserRequest,
  UpdateUserRequest,
  RoleFilters,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleWithUserCount,
  PermissionFilters,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  PermissionWithRoleCount,
  AuditLogFilters,
  AuditLogStats,
  SystemSettings,
  UpdateSystemSettingsRequest,
  BulkUserOperation,
  BulkOperationResult,
  AdminDashboardStats,
} from '@/types/admin.types';

export class AdminAPI {
  // ========================================
  // Dashboard & Analytics
  // ========================================
  
  static async getDashboardStats(): Promise<ApiResponse<AdminDashboardStats>> {
    return apiClient.get<AdminDashboardStats>('/api/v1/admin/dashboard/stats');
  }

  // ========================================
  // User Management
  // ========================================
  
  static async getUsers(
    filters?: UserFilters,
    page = 1,
    size = 50
  ): Promise<ApiResponse<PaginatedResponse<User>>> {
    const params = {
      page,
      size,
      ...filters,
    };
    return apiClient.get<PaginatedResponse<User>>('/api/v1/admin/users', params);
  }

  static async getUserById(userId: string): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`/api/v1/admin/users/${userId}`);
  }

  static async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.post<User>('/api/v1/admin/users', userData);
  }

  static async updateUser(
    userId: string,
    userData: UpdateUserRequest
  ): Promise<ApiResponse<User>> {
    return apiClient.patch<User>(`/api/v1/admin/users/${userId}`, userData);
  }

  static async deleteUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/api/v1/admin/users/${userId}`);
  }

  static async getUserStats(): Promise<ApiResponse<UserStats>> {
    return apiClient.get<UserStats>('/api/v1/admin/users/stats');
  }

  static async activateUser(userId: string): Promise<ApiResponse<User>> {
    return apiClient.post<User>(`/api/v1/admin/users/${userId}/activate`);
  }

  static async deactivateUser(userId: string): Promise<ApiResponse<User>> {
    return apiClient.post<User>(`/api/v1/admin/users/${userId}/deactivate`);
  }

  static async verifyUser(userId: string): Promise<ApiResponse<User>> {
    return apiClient.post<User>(`/api/v1/admin/users/${userId}/verify`);
  }

  static async unverifyUser(userId: string): Promise<ApiResponse<User>> {
    return apiClient.post<User>(`/api/v1/admin/users/${userId}/unverify`);
  }

  static async assignRoleToUser(
    userId: string,
    roleId: string
  ): Promise<ApiResponse<User>> {
    return apiClient.post<User>(`/api/v1/admin/users/${userId}/roles/${roleId}`);
  }

  static async removeRoleFromUser(
    userId: string,
    roleId: string
  ): Promise<ApiResponse<User>> {
    return apiClient.delete<User>(`/api/v1/admin/users/${userId}/roles/${roleId}`);
  }

  static async bulkUserOperation(
    operation: BulkUserOperation
  ): Promise<ApiResponse<BulkOperationResult>> {
    return apiClient.post<BulkOperationResult>('/api/v1/admin/users/bulk', operation);
  }

  // ========================================
  // Role Management
  // ========================================
  
  static async getRoles(
    filters?: RoleFilters,
    page = 1,
    size = 50
  ): Promise<ApiResponse<PaginatedResponse<RoleWithUserCount>>> {
    const params = {
      page,
      size,
      ...filters,
    };
    return apiClient.get<PaginatedResponse<RoleWithUserCount>>('/api/v1/admin/roles', params);
  }

  static async getAllRoles(): Promise<ApiResponse<Role[]>> {
    return apiClient.get<Role[]>('/api/v1/admin/roles/all');
  }

  static async getRoleById(roleId: string): Promise<ApiResponse<Role>> {
    return apiClient.get<Role>(`/api/v1/admin/roles/${roleId}`);
  }

  static async createRole(roleData: CreateRoleRequest): Promise<ApiResponse<Role>> {
    return apiClient.post<Role>('/api/v1/admin/roles', roleData);
  }

  static async updateRole(
    roleId: string,
    roleData: UpdateRoleRequest
  ): Promise<ApiResponse<Role>> {
    return apiClient.patch<Role>(`/api/v1/admin/roles/${roleId}`, roleData);
  }

  static async deleteRole(roleId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/api/v1/admin/roles/${roleId}`);
  }

  static async assignPermissionToRole(
    roleId: string,
    permissionId: string
  ): Promise<ApiResponse<Role>> {
    return apiClient.post<Role>(`/api/v1/admin/roles/${roleId}/permissions/${permissionId}`);
  }

  static async removePermissionFromRole(
    roleId: string,
    permissionId: string
  ): Promise<ApiResponse<Role>> {
    return apiClient.delete<Role>(`/api/v1/admin/roles/${roleId}/permissions/${permissionId}`);
  }

  // ========================================
  // Permission Management
  // ========================================
  
  static async getPermissions(
    filters?: PermissionFilters,
    page = 1,
    size = 50
  ): Promise<ApiResponse<PaginatedResponse<PermissionWithRoleCount>>> {
    const params = {
      page,
      size,
      ...filters,
    };
    return apiClient.get<PaginatedResponse<PermissionWithRoleCount>>(
      '/api/v1/admin/permissions',
      params
    );
  }

  static async getAllPermissions(): Promise<ApiResponse<Permission[]>> {
    return apiClient.get<Permission[]>('/api/v1/admin/permissions/all');
  }

  static async getPermissionById(permissionId: string): Promise<ApiResponse<Permission>> {
    return apiClient.get<Permission>(`/api/v1/admin/permissions/${permissionId}`);
  }

  static async createPermission(
    permissionData: CreatePermissionRequest
  ): Promise<ApiResponse<Permission>> {
    return apiClient.post<Permission>('/api/v1/admin/permissions', permissionData);
  }

  static async updatePermission(
    permissionId: string,
    permissionData: UpdatePermissionRequest
  ): Promise<ApiResponse<Permission>> {
    return apiClient.patch<Permission>(
      `/api/v1/admin/permissions/${permissionId}`,
      permissionData
    );
  }

  static async deletePermission(permissionId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/api/v1/admin/permissions/${permissionId}`);
  }

  // ========================================
  // Audit Log Management
  // ========================================
  
  static async getAuditLogs(
    filters?: AuditLogFilters,
    page = 1,
    size = 50
  ): Promise<ApiResponse<PaginatedResponse<AuditLog>>> {
    const params = {
      page,
      size,
      ...filters,
    };
    return apiClient.get<PaginatedResponse<AuditLog>>('/api/v1/admin/audit-logs', params);
  }

  static async getAuditLogById(logId: string): Promise<ApiResponse<AuditLog>> {
    return apiClient.get<AuditLog>(`/api/v1/admin/audit-logs/${logId}`);
  }

  static async getAuditLogStats(
    filters?: Pick<AuditLogFilters, 'dateFrom' | 'dateTo'>
  ): Promise<ApiResponse<AuditLogStats>> {
    return apiClient.get<AuditLogStats>('/api/v1/admin/audit-logs/stats', filters);
  }

  static async exportAuditLogs(
    filters?: AuditLogFilters,
    format: 'csv' | 'json' = 'csv'
  ): Promise<ApiResponse<{ download_url: string }>> {
    const params = {
      format,
      ...filters,
    };
    return apiClient.get<{ download_url: string }>('/api/v1/admin/audit-logs/export', params);
  }

  // ========================================
  // System Settings
  // ========================================
  
  static async getSystemSettings(): Promise<ApiResponse<SystemSettings>> {
    return apiClient.get<SystemSettings>('/api/v1/admin/settings');
  }

  static async updateSystemSettings(
    settings: UpdateSystemSettingsRequest
  ): Promise<ApiResponse<SystemSettings>> {
    return apiClient.patch<SystemSettings>('/api/v1/admin/settings', settings);
  }

  // ========================================
  // System Health & Monitoring
  // ========================================
  
  static async getSystemHealth(): Promise<ApiResponse<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    database: {
      status: 'connected' | 'disconnected';
      response_time: number;
    };
    redis: {
      status: 'connected' | 'disconnected';
      response_time: number;
    };
    services: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      response_time?: number;
      error?: string;
    }>;
  }>> {
    return apiClient.get('/api/v1/admin/health');
  }

  static async getSystemMetrics(): Promise<ApiResponse<{
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    active_connections: number;
    requests_per_minute: number;
    error_rate: number;
    avg_response_time: number;
  }>> {
    return apiClient.get('/api/v1/admin/metrics');
  }

  // ========================================
  // Data Management
  // ========================================
  
  static async backupDatabase(): Promise<ApiResponse<{
    backup_id: string;
    download_url: string;
    created_at: string;
    size: number;
  }>> {
    return apiClient.post('/api/v1/admin/backup');
  }

  static async getBackupHistory(): Promise<ApiResponse<Array<{
    backup_id: string;
    created_at: string;
    size: number;
    type: 'manual' | 'scheduled';
    status: 'completed' | 'failed' | 'in_progress';
  }>>> {
    return apiClient.get('/api/v1/admin/backups');
  }

  static async restoreDatabase(backupId: string): Promise<ApiResponse<{
    restore_id: string;
    status: 'started' | 'completed' | 'failed';
  }>> {
    return apiClient.post(`/api/v1/admin/restore/${backupId}`);
  }

  // ========================================
  // Advanced Search & Reporting
  // ========================================
  
  static async advancedUserSearch(query: {
    search?: string;
    roles?: string[];
    permissions?: string[];
    registration_date_from?: string;
    registration_date_to?: string;
    last_login_from?: string;
    last_login_to?: string;
    failed_login_attempts_min?: number;
    failed_login_attempts_max?: number;
  }): Promise<ApiResponse<User[]>> {
    return apiClient.post<User[]>('/api/v1/admin/users/search', query);
  }

  static async generateUserReport(
    format: 'csv' | 'json' | 'pdf',
    filters?: UserFilters
  ): Promise<ApiResponse<{ download_url: string }>> {
    const params = {
      format,
      ...filters,
    };
    return apiClient.get<{ download_url: string }>('/api/v1/admin/reports/users', params);
  }

  static async generateActivityReport(
    format: 'csv' | 'json' | 'pdf',
    filters?: AuditLogFilters
  ): Promise<ApiResponse<{ download_url: string }>> {
    const params = {
      format,
      ...filters,
    };
    return apiClient.get<{ download_url: string }>('/api/v1/admin/reports/activity', params);
  }
}

export default AdminAPI;