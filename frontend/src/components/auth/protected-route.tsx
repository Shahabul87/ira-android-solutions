'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRouteProps } from '@/types';

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallback = <div className='flex items-center justify-center min-h-screen'>Access Denied</div>,
}: ProtectedRouteProps): JSX.Element {
  const { user, isAuthenticated, isLoading, hasPermission, hasRole } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return <div className='flex items-center justify-center min-h-screen'>Redirecting to login...</div>;
  }

  // Check required roles
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Check required permissions
  if (requiredPermissions.length > 0) {
    const hasRequiredPermission = requiredPermissions.some(permission => hasPermission(permission));
    if (!hasRequiredPermission) {
      return <>{fallback}</>;
    }
  }

  // User has access, render children
  return <>{children}</>;
}

export default ProtectedRoute;