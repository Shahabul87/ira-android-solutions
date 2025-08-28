/**
 * Authentication Context Tests
 * 
 * Comprehensive tests for the authentication context provider
 * including login, logout, token management, and permissions.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import AuthAPI from '@/lib/auth-api';
import * as cookieManager from '@/lib/cookie-manager';
import { User, TokenPair, LoginRequest, RegisterRequest } from '@/types';

// Mock dependencies
jest.mock('@/lib/auth-api');
jest.mock('@/lib/cookie-manager');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('AuthContext', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    is_active: true,
    is_verified: true,
    is_superuser: false,
    failed_login_attempts: 0,
    user_metadata: {},
    roles: [{
      id: 'role-1',
      name: 'user',
      description: 'Standard user role',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      permissions: []
    }],
    created_at: new Date(),
    updated_at: new Date(),
    last_login: new Date(),
  };

  const mockTokens: TokenPair = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (cookieManager.getAuthTokens as jest.Mock).mockReturnValue(null);
    (cookieManager.hasAuthCookies as jest.Mock).mockReturnValue(false);
    (cookieManager.isTokenExpired as jest.Mock).mockReturnValue(false);
    (cookieManager.getCookie as jest.Mock).mockReturnValue(null);
    
    // Clear sessionStorage
    sessionStorage.clear();
  });

  describe('Initial State', () => {
    it('should initialize with unauthenticated state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.permissions).toEqual([]);
    });

    it('should load stored authentication on mount', async () => {
      // Setup stored auth
      (cookieManager.getAuthTokens as jest.Mock).mockReturnValue(mockTokens);
      (cookieManager.getCookie as jest.Mock).mockReturnValue(mockTokens.access_token);
      sessionStorage.setItem('auth_user', JSON.stringify(mockUser));

      (AuthAPI.getUserPermissions as jest.Mock).mockResolvedValue({
        success: true,
        data: ['users:read', 'users:write'],
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.tokens).toEqual(mockTokens);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.permissions).toEqual(['users:read', 'users:write']);
    });

    it('should refresh expired tokens on mount', async () => {
      // Setup expired token scenario
      (cookieManager.getAuthTokens as jest.Mock).mockReturnValue(mockTokens);
      (cookieManager.getCookie as jest.Mock).mockReturnValue(mockTokens.access_token);
      (cookieManager.isTokenExpired as jest.Mock).mockReturnValue(true);
      sessionStorage.setItem('auth_user', JSON.stringify(mockUser));

      const newTokens: TokenPair = {
        ...mockTokens,
        access_token: 'new-access-token',
      };

      (AuthAPI.refreshToken as jest.Mock).mockResolvedValue({
        success: true,
        data: newTokens,
      });

      (AuthAPI.getCurrentUser as jest.Mock).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(AuthAPI.refreshToken).toHaveBeenCalled();
      expect(result.current.tokens).toEqual(newTokens);
    });
  });

  describe('Login', () => {
    it('should successfully login user', async () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
      };

      (AuthAPI.login as jest.Mock).mockResolvedValue({
        success: true,
        data: mockTokens,
      });

      (AuthAPI.getCurrentUser as jest.Mock).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      (AuthAPI.getUserPermissions as jest.Mock).mockResolvedValue({
        success: true,
        data: ['users:read'],
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult: boolean = false;
      await act(async () => {
        loginResult = await result.current.login(loginRequest);
      });

      expect(loginResult).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.tokens).toEqual(mockTokens);
      expect(result.current.isAuthenticated).toBe(true);
      expect(cookieManager.storeAuthTokens).toHaveBeenCalledWith(mockTokens);
    });

    it('should handle login failure', async () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      (AuthAPI.login as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult: boolean = false;
      await act(async () => {
        loginResult = await result.current.login(loginRequest);
      });

      expect(loginResult).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Register', () => {
    it('should successfully register and login user', async () => {
      const registerRequest: RegisterRequest = {
        email: 'new@example.com',
        password: 'SecurePassword123!',
        first_name: 'New',
        last_name: 'User',
      };

      (AuthAPI.register as jest.Mock).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      (AuthAPI.login as jest.Mock).mockResolvedValue({
        success: true,
        data: mockTokens,
      });

      (AuthAPI.getCurrentUser as jest.Mock).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      (AuthAPI.getUserPermissions as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let registerResult: boolean = false;
      await act(async () => {
        registerResult = await result.current.register(registerRequest);
      });

      expect(registerResult).toBe(true);
      expect(AuthAPI.register).toHaveBeenCalledWith(registerRequest);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle registration failure', async () => {
      const registerRequest: RegisterRequest = {
        email: 'existing@example.com',
        password: 'SecurePassword123!',
        first_name: 'New',
        last_name: 'User',
      };

      (AuthAPI.register as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'Email already exists' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let registerResult: boolean = false;
      await act(async () => {
        registerResult = await result.current.register(registerRequest);
      });

      expect(registerResult).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Logout', () => {
    it('should successfully logout user', async () => {
      // Setup authenticated state
      (cookieManager.getAuthTokens as jest.Mock).mockReturnValue(mockTokens);
      sessionStorage.setItem('auth_user', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      (AuthAPI.logout as jest.Mock).mockResolvedValue({
        success: true,
        data: { message: 'Logged out' },
      });

      act(() => {
        result.current.logout();
      });

      expect(cookieManager.clearAuthCookies).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Token Refresh', () => {
    it('should successfully refresh tokens', async () => {
      // Setup authenticated state
      (cookieManager.getAuthTokens as jest.Mock).mockReturnValue(mockTokens);
      sessionStorage.setItem('auth_user', JSON.stringify(mockUser));

      const newTokens: TokenPair = {
        ...mockTokens,
        access_token: 'refreshed-access-token',
      };

      (AuthAPI.refreshToken as jest.Mock).mockResolvedValue({
        success: true,
        data: newTokens,
      });

      (AuthAPI.getCurrentUser as jest.Mock).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      let refreshResult: boolean = false;
      await act(async () => {
        refreshResult = await result.current.refreshToken();
      });

      expect(refreshResult).toBe(true);
      expect(result.current.tokens).toEqual(newTokens);
    });
  });

  describe('Permissions', () => {
    it('should check user permissions correctly', async () => {
      // Setup authenticated state with permissions
      (cookieManager.getAuthTokens as jest.Mock).mockReturnValue(mockTokens);
      sessionStorage.setItem('auth_user', JSON.stringify(mockUser));

      (AuthAPI.getUserPermissions as jest.Mock).mockResolvedValue({
        success: true,
        data: ['users:read', 'users:write', 'content:*'],
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.permissions).toEqual(['users:read', 'users:write', 'content:*']);
      });

      expect(result.current.hasPermission('users:read')).toBe(true);
      expect(result.current.hasPermission('users:write')).toBe(true);
      expect(result.current.hasPermission('users:delete')).toBe(false);
      
      // Wildcard permission check
      expect(result.current.hasPermission('content:read')).toBe(true);
      expect(result.current.hasPermission('content:write')).toBe(true);
    });

    it('should check user roles correctly', async () => {
      // Setup authenticated state
      (cookieManager.getAuthTokens as jest.Mock).mockReturnValue(mockTokens);
      const userWithRoles = {
        ...mockUser,
        roles: [
          { id: 'role-1', name: 'user' },
          { id: 'role-2', name: 'admin' },
        ],
      };
      sessionStorage.setItem('auth_user', JSON.stringify(userWithRoles));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(userWithRoles);
      });

      expect(result.current.hasRole('user')).toBe(true);
      expect(result.current.hasRole('admin')).toBe(true);
      expect(result.current.hasRole('superadmin')).toBe(false);
    });
  });

  describe('Update User', () => {
    it('should update user data', async () => {
      // Setup authenticated state
      (cookieManager.getAuthTokens as jest.Mock).mockReturnValue(mockTokens);
      sessionStorage.setItem('auth_user', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      const updates = {
        first_name: 'Updated',
        last_name: 'Name',
      };

      act(() => {
        result.current.updateUser(updates);
      });

      expect(result.current.user?.first_name).toBe('Updated');
      expect(result.current.user?.last_name).toBe('Name');
      
      // Check sessionStorage was updated
      const storedUser = JSON.parse(sessionStorage.getItem('auth_user') || '{}');
      expect(storedUser.first_name).toBe('Updated');
    });
  });
});