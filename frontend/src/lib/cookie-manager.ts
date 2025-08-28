/**
 * Cookie Manager - Secure cookie handling utilities
 * 
 * Provides type-safe methods for managing authentication cookies
 * with proper security settings (httpOnly, secure, sameSite).
 */

import { TokenPair } from '@/types';

interface CookieOptions {
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean;
}

/**
 * Cookie names for authentication tokens
 */
export const AUTH_COOKIES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  SESSION_ID: 'session_id',
} as const;

/**
 * Get cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  
  return null;
}

/**
 * Set cookie with security options
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  if (typeof window === 'undefined') return;
  
  const {
    expires,
    path = '/',
    domain,
    secure = window.location.protocol === 'https:',
    sameSite = 'lax',
  } = options;
  
  let cookieString = `${name}=${encodeURIComponent(value)}`;
  
  if (expires) {
    cookieString += `; expires=${expires.toUTCString()}`;
  }
  
  cookieString += `; path=${path}`;
  
  if (domain) {
    cookieString += `; domain=${domain}`;
  }
  
  if (secure) {
    cookieString += '; secure';
  }
  
  cookieString += `; samesite=${sameSite}`;
  
  document.cookie = cookieString;
}

/**
 * Delete cookie by name
 */
export function deleteCookie(name: string, path = '/'): void {
  if (typeof window === 'undefined') return;
  
  setCookie(name, '', {
    expires: new Date(0),
    path,
  });
}

/**
 * Store authentication tokens in cookies
 * Note: These should ideally be httpOnly cookies set by the server
 */
export function storeAuthTokens(tokens: TokenPair): void {
  const expiresIn = tokens.expires_in || 3600; // Default 1 hour
  const expires = new Date(Date.now() + expiresIn * 1000);
  
  // Store access token (should be httpOnly in production)
  setCookie(AUTH_COOKIES.ACCESS_TOKEN, tokens.access_token, {
    expires,
    secure: true,
    sameSite: 'strict',
  });
  
  // Store refresh token with longer expiry
  const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  setCookie(AUTH_COOKIES.REFRESH_TOKEN, tokens.refresh_token, {
    expires: refreshExpires,
    secure: true,
    sameSite: 'strict',
  });
}

/**
 * Get authentication tokens from cookies
 */
export function getAuthTokens(): TokenPair | null {
  const accessToken = getCookie(AUTH_COOKIES.ACCESS_TOKEN);
  const refreshToken = getCookie(AUTH_COOKIES.REFRESH_TOKEN);
  
  if (!accessToken || !refreshToken) {
    return null;
  }
  
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'bearer',
    expires_in: 3600, // Default, actual value should come from server
  };
}

/**
 * Clear all authentication cookies
 */
export function clearAuthCookies(): void {
  deleteCookie(AUTH_COOKIES.ACCESS_TOKEN);
  deleteCookie(AUTH_COOKIES.REFRESH_TOKEN);
  deleteCookie(AUTH_COOKIES.SESSION_ID);
}

/**
 * Check if user has valid authentication cookies
 */
export function hasAuthCookies(): boolean {
  return !!(getCookie(AUTH_COOKIES.ACCESS_TOKEN) && getCookie(AUTH_COOKIES.REFRESH_TOKEN));
}

/**
 * Parse JWT token payload (for client-side use only)
 * WARNING: Do not use for security decisions
 */
export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    if (!payload) return null;
    
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if JWT token is expired (client-side check only)
 * WARNING: Do not use for security decisions
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload['exp'] !== 'number') return true;
  
  const now = Math.floor(Date.now() / 1000);
  return payload['exp'] <= now;
}

/**
 * Get token expiration time in seconds
 */
export function getTokenExpiration(token: string): number | null {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload['exp'] !== 'number') return null;
  
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload['exp'] - now);
}