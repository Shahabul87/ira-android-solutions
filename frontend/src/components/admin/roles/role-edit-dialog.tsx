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
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Role } from '@/types';
import { UpdateRoleRequest } from '@/types/admin.types';
import AdminAPI from '@/lib/admin-api';

interface RoleEditDialogProps {
  role: Role;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RoleEditDialog({
  role,
  open,
  onClose,
  onSuccess,
}: RoleEditDialogProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<UpdateRoleRequest>({
    name: role.name,
    description: role.description || '',
    is_active: role.is_active,
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset form when role changes
  useEffect(() => {
    setFormData({
      name: role.name,
      description: role.description || '',
      is_active: role.is_active,
    });
    setValidationErrors({});
    setError(null);
  }, [role]);

  // Check if role is a system role
  const isSystemRole = role.name === 'admin' || role.name === 'user';

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.name && formData.name.length < 3) {
      errors['name'] = 'Role name must be at least 3 characters';
    } else if (formData.name && !/^[a-zA-Z0-9_-]+$/.test(formData.name)) {
      errors['name'] = 'Role name can only contain letters, numbers, hyphens, and underscores';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if any changes were made
  const hasChanges = (): boolean => {
    return (
      formData.name !== role.name ||
      formData.description !== (role.description || '') ||
      formData.is_active !== role.is_active
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!hasChanges()) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await AdminAPI.updateRole(role.id, formData);

      if (response.success) {
        onSuccess();
      } else {
        throw new Error(response.error?.message || 'Failed to update role');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role details and settings
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isSystemRole && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This is a system role. Some properties cannot be modified.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value.toLowerCase() })
                }
                disabled={loading || isSystemRole}
              />
              {validationErrors['name'] && (
                <p className="text-sm text-destructive">
                  {validationErrors['name']}
                </p>
              )}
              {isSystemRole && (
                <p className="text-xs text-muted-foreground">
                  System roles cannot be renamed
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

            <div className="space-y-2">
              <Label>Role ID</Label>
              <Input value={role.id} disabled />
              <p className="text-xs text-muted-foreground">
                This cannot be changed
              </p>
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

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Permissions</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {role.permissions?.length || 0} permissions
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm">
                  {new Date(role.created_at).toLocaleDateString()}
                </p>
              </div>
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
            <Button type="submit" disabled={loading || !hasChanges()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}