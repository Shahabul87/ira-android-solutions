'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  TokenPair, 
  AuthContextType, 
  LoginRequest, 
  RegisterRequest
} from '@/types';
import AuthAPI from '@/lib/auth-api';
import { 
  storeAuthTokens, 
  getAuthTokens, 
  clearAuthCookies, 
  hasAuthCookies,
  isTokenExpired,
  getCookie,
  AUTH_COOKIES
} from '@/lib/cookie-manager';

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage key for user data only (non-sensitive)
const USER_KEY = 'auth_user';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<TokenPair | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  
  const router = useRouter();

  // Helper function to clear all auth data
  const clearAuthData = useCallback((): void => {
    setUser(null);
    setTokens(null);
    setPermissions([]);
    
    if (typeof window !== 'undefined') {
      clearAuthCookies();
      sessionStorage.removeItem(USER_KEY);
    }
  }, []);

  // Helper function to store auth data
  const storeAuthData = useCallback((userData: User, tokenData: TokenPair): void => {
    setUser(userData);
    setTokens(tokenData);
    
    if (typeof window !== 'undefined') {
      // Store tokens in secure cookies
      storeAuthTokens(tokenData);
      // Store user data in sessionStorage (non-sensitive)
      sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
    }
  }, []);

  // Get current user data from API
  const getCurrentUser = useCallback(async (): Promise<void> => {
    try {
      const response = await AuthAPI.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(USER_KEY, JSON.stringify(response.data));
        }
      }
    } catch {
      // Failed to get current user - continue
    }
  }, []);

  // Load user permissions
  const loadUserPermissions = useCallback(async (): Promise<void> => {
    try {
      const response = await AuthAPI.getUserPermissions();
      if (response.success && response.data) {
        setPermissions(response.data);
      }
    } catch {
      // Failed to load user permissions - continue without them
    }
  }, []);

  // Attempt to refresh expired tokens
  const attemptTokenRefresh = useCallback(async (currentTokens: TokenPair): Promise<void> => {
    try {
      const response = await AuthAPI.refreshToken({
        refresh_token: currentTokens.refresh_token,
      });

      if (response.success && response.data) {
        const newTokens = response.data;
        setTokens(newTokens);
        
        if (typeof window !== 'undefined') {
          storeAuthTokens(newTokens);
        }

        // Fetch updated user data
        await getCurrentUser();
      } else {
        clearAuthData();
      }
    } catch {
      // Failed to refresh token - clear auth data
      clearAuthData();
    }
  }, [clearAuthData, getCurrentUser]);

  // Load stored auth data on mount
  useEffect(() => {
    const loadStoredAuth = async (): Promise<void> => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      try {
        // Get tokens from cookies
        const storedTokens = getAuthTokens();
        const storedUser = sessionStorage.getItem(USER_KEY);

        if (storedTokens && storedUser) {
          const parsedUser: User = JSON.parse(storedUser);
          
          // Check if access token is expired
          const accessToken = getCookie(AUTH_COOKIES.ACCESS_TOKEN);
          if (accessToken && !isTokenExpired(accessToken)) {
            setUser(parsedUser);
            setTokens(storedTokens);
            // Load user permissions
            await loadUserPermissions();
          } else if (storedTokens.refresh_token) {
            // Access token expired, try to refresh
            await attemptTokenRefresh(storedTokens);
          } else {
            // No valid tokens
            clearAuthData();
          }
        } else if (hasAuthCookies()) {
          // Have cookies but no user data, fetch user
          await getCurrentUser();
          await loadUserPermissions();
        }
      } catch {
        // Failed to load stored auth data - clear it
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, [clearAuthData, attemptTokenRefresh, loadUserPermissions, getCurrentUser]);

  // Login function
  const login = useCallback(async (credentials: LoginRequest): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await AuthAPI.login(credentials);
      
      if (response.success && response.data) {
        const loginData = response.data;
        
        // Extract token pair from login response
        const tokenPair: TokenPair = {
          access_token: loginData.access_token,
          refresh_token: loginData.refresh_token,
          token_type: loginData.token_type,
          expires_in: loginData.expires_in,
        };
        
        // Store user and token data
        storeAuthData(loginData.user, tokenPair);
        await loadUserPermissions();
        return true;
      }
      
      return false;
    } catch {
      // Login failed
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [storeAuthData, loadUserPermissions]);

  // Register function
  const register = useCallback(async (userData: RegisterRequest): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await AuthAPI.register(userData);
      
      if (response.success && response.data) {
        // Auto-login after registration
        const loginSuccess = await login({
          email: userData.email,
          password: userData.password,
        });
        
        return loginSuccess;
      }
      
      return false;
    } catch {
      // Registration failed
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  // Logout function
  const logout = useCallback((): void => {
    // Call logout API in background (don't wait for response)
    AuthAPI.logout().catch(() => {
      // Logout API call failed - continue with local logout
    });
    
    clearAuthData();
    router.push('/auth/login');
  }, [clearAuthData, router]);

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!tokens) return false;
    
    try {
      await attemptTokenRefresh(tokens);
      return true;
    } catch {
      // Token refresh failed
      return false;
    }
  }, [tokens, attemptTokenRefresh]);

  // Update user function
  const updateUser = useCallback((userData: Partial<User>): void => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      }
    }
  }, [user]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!permissions.length) return false;
    
    // Check for exact match
    if (permissions.includes(permission)) return true;
    
    // Check for wildcard permissions (e.g., 'content:*' covers 'content:read')
    return permissions.some(perm => {
      if (perm.endsWith(':*')) {
        const permissionBase = perm.slice(0, -1); // Remove '*'
        return permission.startsWith(permissionBase);
      }
      return false;
    });
  }, [permissions]);

  // Check if user has specific role
  const hasRole = useCallback((role: string): boolean => {
    if (!user || !user.roles) return false;
    
    return user.roles.some(userRole => userRole.name === role);
  }, [user]);

  // Context value
  const contextValue: AuthContextType = {
    user,
    tokens,
    isAuthenticated: Boolean(user && tokens),
    isLoading,
    permissions,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Hook for protected routes
export function useRequireAuth(redirectTo = '/auth/login'): AuthContextType {
  const auth = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push(redirectTo);
    }
  }, [auth.isAuthenticated, auth.isLoading, router, redirectTo]);
  
  return auth;
}

// Hook for guest-only routes (redirect authenticated users)
export function useGuestOnly(redirectTo = '/dashboard'): AuthContextType {
  const auth = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      router.push(redirectTo);
    }
  }, [auth.isAuthenticated, auth.isLoading, router, redirectTo]);
  
  return auth;
}