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
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { User } from '@/types';
import { UserFilters, BulkUserOperation } from '@/types/admin.types';
import AdminAPI from '@/lib/admin-api';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useDebounce } from '@/hooks/use-debounce';
import UserCreateDialog from './user-create-dialog';
import UserEditDialog from './user-edit-dialog';
import UserDeleteDialog from './user-delete-dialog';
import UserRoleDialog from './user-role-dialog';

interface UserTableProps {
  className?: string;
}

export default function UserTable({ className }: UserTableProps): JSX.Element {
  const { hasPermission, user: currentUser } = useAuth();
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'verified' | 'unverified' | 'all'>('all');
  const [roleFilter] = useState<string>('all');
  
  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [roleManagementUser, setRoleManagementUser] = useState<User | null>(null);
  
  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Check permissions
  const canCreate = hasPermission('users:create');
  const canEdit = hasPermission('users:update');
  const canDelete = hasPermission('users:delete');
  const canManageRoles = hasPermission('roles:manage');

  // Load users
  const loadUsers = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const filters: UserFilters = {};
      if (debouncedSearchTerm) filters.search = debouncedSearchTerm;
      filters.status = statusFilter;
      if (verifiedFilter !== 'all') filters.isVerified = verifiedFilter === 'verified';
      if (roleFilter !== 'all') filters.role = roleFilter;

      const response = await AdminAPI.getUsers(filters, currentPage, pageSize);

      if (response.success && response.data) {
        setUsers(response.data.items);
        setTotalPages(response.data.pages);
        setTotalUsers(response.data.total);
      } else {
        throw new Error(response.error?.message || 'Failed to load users');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter, verifiedFilter, roleFilter, currentPage, pageSize]);

  // Load users on mount and when filters change
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle select all
  const handleSelectAll = (checked: boolean): void => {
    if (checked) {
      setSelectedUsers(new Set(users.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  // Handle select user
  const handleSelectUser = (userId: string, checked: boolean): void => {
    const newSelection = new Set(selectedUsers);
    if (checked) {
      newSelection.add(userId);
    } else {
      newSelection.delete(userId);
    }
    setSelectedUsers(newSelection);
  };

  // Handle bulk operations
  const handleBulkOperation = async (operation: BulkUserOperation['operation']): Promise<void> => {
    if (selectedUsers.size === 0) return;

    try {
      setLoading(true);
      const response = await AdminAPI.bulkUserOperation({
        user_ids: Array.from(selectedUsers),
        operation,
      });

      if (response.success) {
        setSelectedUsers(new Set());
        await loadUsers();
      } else {
        throw new Error(response.error?.message || 'Bulk operation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bulk operation failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle user activation toggle
  const handleToggleActive = async (user: User): Promise<void> => {
    try {
      if (user.is_active) {
        await AdminAPI.deactivateUser(user.id);
      } else {
        await AdminAPI.activateUser(user.id);
      }
      await loadUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user status';
      setError(errorMessage);
    }
  };

  // Handle user verification toggle
  const handleToggleVerified = async (user: User): Promise<void> => {
    try {
      if (user.is_verified) {
        await AdminAPI.unverifyUser(user.id);
      } else {
        await AdminAPI.verifyUser(user.id);
      }
      await loadUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update verification status';
      setError(errorMessage);
    }
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'json'): Promise<void> => {
    try {
      const reportFilters: UserFilters = {};
      if (debouncedSearchTerm) reportFilters.search = debouncedSearchTerm;
      reportFilters.status = statusFilter;
      if (verifiedFilter !== 'all') reportFilters.isVerified = verifiedFilter === 'verified';
      if (roleFilter !== 'all') reportFilters.role = roleFilter;
      
      const response = await AdminAPI.generateUserReport(format, reportFilters);

      if (response.success && response.data) {
        window.open(response.data.download_url, '_blank');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export users';
      setError(errorMessage);
    }
  };

  // Render user row
  const renderUserRow = (user: User): JSX.Element => {
    const isCurrentUser = currentUser?.id === user.id;
    
    return (
      <TableRow key={user.id}>
        <TableCell className="w-12">
          <Checkbox
            checked={selectedUsers.has(user.id)}
            onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
            disabled={isCurrentUser}
          />
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium">
              {user.first_name} {user.last_name}
            </span>
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex gap-1 flex-wrap">
            {user.roles?.map((role) => (
              <Badge key={role.id} variant="secondary">
                {role.name}
              </Badge>
            ))}
            {user.is_superuser && (
              <Badge variant="destructive">Super Admin</Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Badge variant={user.is_active ? 'default' : 'secondary'}>
              {user.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {user.is_verified && (
              <Badge variant="outline">Verified</Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <span className="text-sm">
            {user.last_login ? formatDate(user.last_login, 'relative') : 'Never'}
          </span>
        </TableCell>
        <TableCell>
          <span className="text-sm">{formatDate(user.created_at, 'short')}</span>
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
                <>
                  <DropdownMenuItem onClick={() => setEditingUser(user)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleToggleActive(user)}
                    disabled={isCurrentUser}
                  >
                    {user.is_active ? (
                      <>
                        <UserX className="mr-2 h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleVerified(user)}>
                    {user.is_verified ? (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Unverify
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Verify
                      </>
                    )}
                  </DropdownMenuItem>
                </>
              )}
              {canManageRoles && (
                <DropdownMenuItem onClick={() => setRoleManagementUser(user)}>
                  <Shield className="mr-2 h-4 w-4" />
                  Manage Roles
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setDeletingUser(user)}
                    className="text-destructive"
                    disabled={isCurrentUser}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete User
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  if (!hasPermission('users:read')) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don&apos;t have permission to view users.
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
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadUsers()}
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
                  Add User
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
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verifiedFilter} onValueChange={(value) => setVerifiedFilter(value as typeof verifiedFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Bulk actions */}
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedUsers.size} user(s) selected
              </span>
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkOperation('activate')}
                >
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkOperation('deactivate')}
                >
                  Deactivate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkOperation('verify')}
                >
                  Verify
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => handleBulkOperation('delete')}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}

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
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.size === users.length && users.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No users found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map(renderUserRow)
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
                </span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(parseInt(value, 10));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="25">25 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                    <SelectItem value="100">100 / page</SelectItem>
                  </SelectContent>
                </Select>
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
        <UserCreateDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={() => {
            setCreateDialogOpen(false);
            loadUsers();
          }}
        />
      )}
      
      {editingUser && (
        <UserEditDialog
          user={editingUser}
          open={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            loadUsers();
          }}
        />
      )}
      
      {deletingUser && (
        <UserDeleteDialog
          user={deletingUser}
          open={Boolean(deletingUser)}
          onClose={() => setDeletingUser(null)}
          onSuccess={() => {
            setDeletingUser(null);
            loadUsers();
          }}
        />
      )}
      
      {roleManagementUser && (
        <UserRoleDialog
          user={roleManagementUser}
          open={Boolean(roleManagementUser)}
          onClose={() => setRoleManagementUser(null)}
          onSuccess={() => {
            setRoleManagementUser(null);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}