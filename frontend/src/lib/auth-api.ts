// Authentication-specific API endpoints with type safety

import apiClient from './api-client';
import {
  User,
  TokenPair,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ConfirmResetPasswordRequest,
  ApiResponse,
} from '@/types';

export class AuthAPI {
  // User registration
  static async register(userData: RegisterRequest): Promise<ApiResponse<User>> {
    return apiClient.post<User>('/api/v1/auth/register', userData);
  }

  // User login
  static async login(credentials: LoginRequest): Promise<ApiResponse<TokenPair>> {
    return apiClient.post<TokenPair>('/api/v1/auth/login', credentials);
  }

  // Refresh access token
  static async refreshToken(refreshTokenData: RefreshTokenRequest): Promise<ApiResponse<TokenPair>> {
    return apiClient.post<TokenPair>('/api/v1/auth/refresh', refreshTokenData);
  }

  // Logout (revoke tokens)
  static async logout(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/api/v1/auth/logout');
  }

  // Get current user profile
  static async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/api/v1/auth/me');
  }

  // Update current user profile
  static async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.patch<User>('/api/v1/auth/me', userData);
  }

  // Change password
  static async changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/api/v1/auth/change-password', passwordData);
  }

  // Request password reset
  static async requestPasswordReset(resetData: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/api/v1/auth/reset-password', resetData);
  }

  // Confirm password reset with token
  static async confirmPasswordReset(confirmData: ConfirmResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/api/v1/auth/reset-password/confirm', confirmData);
  }

  // Verify email address
  static async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/api/v1/auth/verify-email', { token });
  }

  // Resend email verification
  static async resendVerification(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/api/v1/auth/verify-email/resend', { email });
  }

  // Check if email is available
  static async checkEmailAvailability(email: string): Promise<ApiResponse<{ available: boolean }>> {
    return apiClient.get<{ available: boolean }>(`/api/v1/auth/check-email?email=${encodeURIComponent(email)}`);
  }

  // Get user permissions
  static async getUserPermissions(): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>('/api/v1/auth/permissions');
  }

  // Get user roles
  static async getUserRoles(): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>('/api/v1/auth/roles');
  }

  // Enable two-factor authentication
  static async enable2FA(): Promise<ApiResponse<{ secret: string; qr_code: string }>> {
    return apiClient.post<{ secret: string; qr_code: string }>('/api/v1/auth/2fa/enable');
  }

  // Confirm two-factor authentication setup
  static async confirm2FA(code: string): Promise<ApiResponse<{ message: string; backup_codes: string[] }>> {
    return apiClient.post<{ message: string; backup_codes: string[] }>('/api/v1/auth/2fa/confirm', { code });
  }

  // Disable two-factor authentication
  static async disable2FA(password: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/api/v1/auth/2fa/disable', { password });
  }

  // Verify 2FA code during login
  static async verify2FA(code: string, token: string): Promise<ApiResponse<TokenPair>> {
    return apiClient.post<TokenPair>('/api/v1/auth/2fa/verify', { code, token });
  }

  // Get active sessions
  static async getActiveSessions(): Promise<ApiResponse<Array<{
    id: string;
    ip_address: string;
    user_agent: string;
    created_at: string;
    last_activity: string;
    is_current: boolean;
  }>>> {
    return apiClient.get('/api/v1/auth/sessions');
  }

  // Revoke a specific session
  static async revokeSession(sessionId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/api/v1/auth/sessions/${sessionId}`);
  }

  // Revoke all other sessions (keep current)
  static async revokeAllOtherSessions(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/api/v1/auth/sessions/revoke-all');
  }

  // OAuth callback - exchange code for tokens
  static async oauthCallback(data: {
    code: string;
    state: string;
    redirect_uri: string;
  }): Promise<ApiResponse<TokenPair>> {
    return apiClient.post<TokenPair>('/api/v1/auth/oauth/callback', data);
  }

  // Get available OAuth providers
  static async getOAuthProviders(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    enabled: boolean;
  }>>> {
    return apiClient.get('/api/v1/auth/oauth/providers');
  }

  // Link OAuth account to existing user
  static async linkOAuthAccount(provider: string): Promise<ApiResponse<{ authorize_url: string }>> {
    return apiClient.post<{ authorize_url: string }>(`/api/v1/auth/oauth/${provider}/link`);
  }

  // Unlink OAuth account from user
  static async unlinkOAuthAccount(provider: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/api/v1/auth/oauth/${provider}/unlink`);
  }

  // Get linked OAuth accounts
  static async getLinkedAccounts(): Promise<ApiResponse<Array<{
    provider: string;
    provider_user_id: string;
    linked_at: string;
  }>>> {
    return apiClient.get('/api/v1/auth/oauth/linked');
  }
}

export default AuthAPI;