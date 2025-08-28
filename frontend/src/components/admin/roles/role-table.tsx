'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Plus,
  RefreshCw,
  AlertCircle,
  Key,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Role } from '@/types';
import { RoleWithUserCount, RoleFilters } from '@/types/admin.types';
import AdminAPI from '@/lib/admin-api';
import { useAuth } from '@/contexts/auth-context';
import { useDebounce } from '@/hooks/use-debounce';
import RoleCreateDialog from './role-create-dialog';
import RoleEditDialog from './role-edit-dialog';
import RoleDeleteDialog from './role-delete-dialog';
import RolePermissionsDialog from './role-permissions-dialog';

interface RoleTableProps {
  className?: string;
}

export default function RoleTable({ className }: RoleTableProps): JSX.Element {
  const { hasPermission } = useAuth();
  
  // State management
  const [roles, setRoles] = useState<RoleWithUserCount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRoles, setTotalRoles] = useState<number>(0);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all');
  
  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [permissionsRole, setPermissionsRole] = useState<Role | null>(null);
  
  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Check permissions
  const canCreate = hasPermission('roles:create');
  const canEdit = hasPermission('roles:update');
  const canDelete = hasPermission('roles:delete');
  const canManagePermissions = hasPermission('permissions:manage');

  // Load roles
  const loadRoles = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const filters: RoleFilters = {};
      if (debouncedSearchTerm) filters.search = debouncedSearchTerm;
      filters.status = statusFilter;

      const response = await AdminAPI.getRoles(filters, currentPage, pageSize);

      if (response.success && response.data) {
        setRoles(response.data.items);
        setTotalPages(response.data.pages);
        setTotalRoles(response.data.total);
      } else {
        throw new Error(response.error?.message || 'Failed to load roles');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load roles';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter, currentPage, pageSize]);

  // Load roles on mount and when filters change
  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  // Render role row
  const renderRoleRow = (role: RoleWithUserCount): JSX.Element => {
    const isSystemRole = role.name === 'admin' || role.name === 'user';
    
    return (
      <TableRow key={role.id}>
        <TableCell>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium">{role.name}</span>
              {isSystemRole && (
                <Badge variant="outline" className="text-xs">
                  System
                </Badge>
              )}
            </div>
            {role.description && (
              <span className="text-sm text-muted-foreground">{role.description}</span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{role.user_count || 0}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <span>{role.permissions?.length || 0}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={role.is_active ? 'default' : 'secondary'}>
            {role.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </TableCell>
        <TableCell>
          <span className="text-sm">
            {new Date(role.created_at).toLocaleDateString()}
          </span>
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canEdit && (
                <DropdownMenuItem onClick={() => setEditingRole(role)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Role
                </DropdownMenuItem>
              )}
              {canManagePermissions && (
                <DropdownMenuItem onClick={() => setPermissionsRole(role)}>
                  <Shield className="mr-2 h-4 w-4" />
                  Manage Permissions
                </DropdownMenuItem>
              )}
              {canDelete && !isSystemRole && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setDeletingRole(role)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Role
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  if (!hasPermission('roles:read')) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don&apos;t have permission to view roles.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>
                Manage roles and their associated permissions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadRoles()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {canCreate && (
                <Button
                  size="sm"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Role
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('inactive')}
              >
                Inactive
              </Button>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No roles found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map(renderRoleRow)
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, totalRoles)} of {totalRoles} roles
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {createDialogOpen && (
        <RoleCreateDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={() => {
            setCreateDialogOpen(false);
            loadRoles();
          }}
        />
      )}
      
      {editingRole && (
        <RoleEditDialog
          role={editingRole}
          open={Boolean(editingRole)}
          onClose={() => setEditingRole(null)}
          onSuccess={() => {
            setEditingRole(null);
            loadRoles();
          }}
        />
      )}
      
      {deletingRole && (
        <RoleDeleteDialog
          role={deletingRole}
          open={Boolean(deletingRole)}
          onClose={() => setDeletingRole(null)}
          onSuccess={() => {
            setDeletingRole(null);
            loadRoles();
          }}
        />
      )}
      
      {permissionsRole && (
        <RolePermissionsDialog
          role={permissionsRole}
          open={Boolean(permissionsRole)}
          onClose={() => setPermissionsRole(null)}
          onSuccess={() => {
            setPermissionsRole(null);
            loadRoles();
          }}
        />
      )}
    </div>
  );
}