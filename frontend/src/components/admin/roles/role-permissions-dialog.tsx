'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Loader2, Shield, Key } from 'lucide-react';
import { Role, Permission } from '@/types';
import AdminAPI from '@/lib/admin-api';

interface RolePermissionsDialogProps {
  role: Role;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RolePermissionsDialog({
  role,
  open,
  onClose,
  onSuccess,
}: RolePermissionsDialogProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [originalPermissions, setOriginalPermissions] = useState<Set<string>>(new Set());

  // Load available permissions and set current role permissions
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        const response = await AdminAPI.getAllPermissions();
        if (response.success && response.data) {
          setAvailablePermissions(response.data);
        }

        // Set current role permissions
        const rolePermissionIds = new Set(role.permissions?.map(p => p.id) || []);
        setSelectedPermissions(rolePermissionIds);
        setOriginalPermissions(rolePermissionIds);
      } catch {
        setError('Failed to load permissions');
      }
    };

    if (open) {
      loadData();
    }
  }, [open, role]);

  // Group permissions by resource
  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    const resource = permission.resource;
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Check if changes were made
  const hasChanges = (): boolean => {
    if (selectedPermissions.size !== originalPermissions.size) return true;
    
    for (const permissionId of selectedPermissions) {
      if (!originalPermissions.has(permissionId)) return true;
    }
    
    return false;
  };

  // Handle permission toggle
  const handlePermissionToggle = (permissionId: string, checked: boolean): void => {
    const newSelection = new Set(selectedPermissions);
    if (checked) {
      newSelection.add(permissionId);
    } else {
      newSelection.delete(permissionId);
    }
    setSelectedPermissions(newSelection);
  };

  // Handle resource group toggle
  const handleResourceToggle = (resource: string, checked: boolean): void => {
    const newSelection = new Set(selectedPermissions);
    const resourcePermissions = groupedPermissions[resource] || [];
    
    if (checked) {
      resourcePermissions.forEach(p => newSelection.add(p.id));
    } else {
      resourcePermissions.forEach(p => newSelection.delete(p.id));
    }
    
    setSelectedPermissions(newSelection);
  };

  // Check if all permissions in a resource are selected
  const isResourceFullySelected = (resource: string): boolean => {
    const resourcePermissions = groupedPermissions[resource] || [];
    return resourcePermissions.every(p => selectedPermissions.has(p.id));
  };

  // Check if some permissions in a resource are selected
  const isResourcePartiallySelected = (resource: string): boolean => {
    const resourcePermissions = groupedPermissions[resource] || [];
    const selectedCount = resourcePermissions.filter(p => selectedPermissions.has(p.id)).length;
    return selectedCount > 0 && selectedCount < resourcePermissions.length;
  };

  // Handle save
  const handleSave = async (): Promise<void> => {
    if (!hasChanges()) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine permissions to add and remove
      const permissionsToAdd: string[] = [];
      const permissionsToRemove: string[] = [];

      for (const permissionId of selectedPermissions) {
        if (!originalPermissions.has(permissionId)) {
          permissionsToAdd.push(permissionId);
        }
      }

      for (const permissionId of originalPermissions) {
        if (!selectedPermissions.has(permissionId)) {
          permissionsToRemove.push(permissionId);
        }
      }

      // Execute permission changes
      const promises: Promise<unknown>[] = [];

      for (const permissionId of permissionsToAdd) {
        promises.push(AdminAPI.assignPermissionToRole(role.id, permissionId));
      }

      for (const permissionId of permissionsToRemove) {
        promises.push(AdminAPI.removePermissionFromRole(role.id, permissionId));
      }

      await Promise.all(promises);
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update permissions';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isSystemRole = role.name === 'admin' || role.name === 'user';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Role Permissions
          </DialogTitle>
          <DialogDescription>
            Configure permissions for the {role.name} role
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Role info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{role.name}</p>
                  {role.description && (
                    <p className="text-xs text-muted-foreground">
                      {role.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge variant={role.is_active ? 'default' : 'secondary'}>
                    {role.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {isSystemRole && (
                    <Badge variant="outline">System Role</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Selected permissions count */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Permissions</p>
              <Badge variant="secondary">
                {selectedPermissions.size} selected
              </Badge>
            </div>

            <Separator />

            {/* Permissions list */}
            <ScrollArea className="h-[350px] w-full rounded-md border p-4">
              <div className="space-y-4">
                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                  <div key={resource} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`resource-${resource}`}
                        checked={isResourceFullySelected(resource)}
                        onCheckedChange={(checked) =>
                          handleResourceToggle(resource, checked as boolean)
                        }
                        disabled={loading}
                        {...(isResourcePartiallySelected(resource) && {
                          'data-state': 'indeterminate',
                        })}
                      />
                      <Label
                        htmlFor={`resource-${resource}`}
                        className="text-sm font-semibold capitalize cursor-pointer flex items-center gap-2"
                      >
                        <Key className="h-3 w-3" />
                        {resource.replace(/_/g, ' ')}
                      </Label>
                    </div>
                    
                    <div className="ml-6 space-y-2">
                      {perms.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={`permission-${permission.id}`}
                            checked={selectedPermissions.has(permission.id)}
                            onCheckedChange={(checked) =>
                              handlePermissionToggle(permission.id, checked as boolean)
                            }
                            disabled={loading}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={`permission-${permission.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {permission.action}
                            </Label>
                            {permission.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {permission.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {permission.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {isSystemRole && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  System roles have predefined permissions that ensure basic system functionality.
                  Changes to these permissions should be made carefully.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !hasChanges()}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Label component (since it's used but not imported from ui/label in this file)
function Label({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}): JSX.Element {
  return (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  );
}