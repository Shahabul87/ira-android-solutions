'use client';

import React from 'react';
import { useRequireAuth } from '@/contexts/auth-context';
import AdminLayout from '@/components/admin/admin-layout';
import RoleTable from '@/components/admin/roles/role-table';

export default function AdminRolesPage(): JSX.Element {
  // Require authentication
  const { user, hasPermission } = useRequireAuth();

  // Check if user has permission to view roles
  if (user && !hasPermission('roles:read')) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              You don&apos;t have permission to view role management.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <RoleTable />
    </AdminLayout>
  );
}