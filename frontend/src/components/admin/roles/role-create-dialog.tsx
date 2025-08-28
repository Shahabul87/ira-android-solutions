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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Loader2 } from 'lucide-react';
import { CreateRoleRequest } from '@/types/admin.types';
import { Permission } from '@/types';
import AdminAPI from '@/lib/admin-api';

interface RoleCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RoleCreateDialog({
  open,
  onClose,
  onSuccess,
}: RoleCreateDialogProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  
  // Form state
  const [formData, setFormData] = useState<CreateRoleRequest>({
    name: '',
    description: '',
    is_active: true,
    permissions: [],
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load available permissions
  useEffect(() => {
    const loadPermissions = async (): Promise<void> => {
      try {
        const response = await AdminAPI.getAllPermissions();
        if (response.success && response.data) {
          setPermissions(response.data);
        }
      } catch {
        // Failed to load permissions
      }
    };

    if (open) {
      loadPermissions();
    }
  }, [open]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        description: '',
        is_active: true,
        permissions: [],
      });
      setSelectedPermissions(new Set());
      setValidationErrors({});
      setError(null);
    }
  }, [open]);

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const resource = permission.resource;
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name) {
      errors['name'] = 'Role name is required';
    } else if (formData.name.length < 3) {
      errors['name'] = 'Role name must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.name)) {
      errors['name'] = 'Role name can only contain letters, numbers, hyphens, and underscores';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await AdminAPI.createRole({
        ...formData,
        permissions: Array.from(selectedPermissions),
      });

      if (response.success) {
        onSuccess();
      } else {
        throw new Error(response.error?.message || 'Failed to create role');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a new role with specific permissions
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">
                Role Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value.toLowerCase() })
                }
                placeholder="e.g., editor, moderator"
                disabled={loading}
              />
              {validationErrors['name'] && (
                <p className="text-sm text-destructive">
                  {validationErrors['name']}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the purpose of this role..."
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active || false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked as boolean })
                }
                disabled={loading}
              />
              <Label
                htmlFor="is_active"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Active Role
              </Label>
              <span className="text-xs text-muted-foreground">
                (Can be assigned to users)
              </span>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <Badge variant="secondary">
                  {selectedPermissions.size} selected
                </Badge>
              </div>
              
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
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
                          className="text-sm font-semibold capitalize cursor-pointer"
                        >
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
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}