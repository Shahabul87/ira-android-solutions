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
import { AlertCircle, Loader2, Shield, X } from 'lucide-react';
import { User, Role } from '@/types';
import AdminAPI from '@/lib/admin-api';

interface UserRoleDialogProps {
  user: User;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserRoleDialog({
  user,
  open,
  onClose,
  onSuccess,
}: UserRoleDialogProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [originalRoles, setOriginalRoles] = useState<Set<string>>(new Set());

  // Load available roles and set current user roles
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        const response = await AdminAPI.getAllRoles();
        if (response.success && response.data) {
          setAvailableRoles(response.data.filter(role => role.is_active));
        }

        // Set current user roles
        const userRoleIds = new Set(user.roles.map(role => role.id));
        setSelectedRoles(userRoleIds);
        setOriginalRoles(userRoleIds);
      } catch {
        setError('Failed to load roles');
      }
    };

    if (open) {
      loadData();
    }
  }, [open, user]);

  // Check if changes were made
  const hasChanges = (): boolean => {
    if (selectedRoles.size !== originalRoles.size) return true;
    
    for (const roleId of selectedRoles) {
      if (!originalRoles.has(roleId)) return true;
    }
    
    return false;
  };

  // Handle role toggle
  const handleRoleToggle = (roleId: string, checked: boolean): void => {
    const newSelection = new Set(selectedRoles);
    if (checked) {
      newSelection.add(roleId);
    } else {
      newSelection.delete(roleId);
    }
    setSelectedRoles(newSelection);
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
      // Determine roles to add and remove
      const rolesToAdd: string[] = [];
      const rolesToRemove: string[] = [];

      for (const roleId of selectedRoles) {
        if (!originalRoles.has(roleId)) {
          rolesToAdd.push(roleId);
        }
      }

      for (const roleId of originalRoles) {
        if (!selectedRoles.has(roleId)) {
          rolesToRemove.push(roleId);
        }
      }

      // Execute role changes
      const promises: Promise<unknown>[] = [];

      for (const roleId of rolesToAdd) {
        promises.push(AdminAPI.assignRoleToUser(user.id, roleId));
      }

      for (const roleId of rolesToRemove) {
        promises.push(AdminAPI.removeRoleFromUser(user.id, roleId));
      }

      await Promise.all(promises);
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update roles';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get role permissions count
  const getRolePermissionCount = (role: Role): number => {
    return role.permissions?.length || 0;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage User Roles
          </DialogTitle>
          <DialogDescription>
            Assign or remove roles for {user.first_name} {user.last_name}
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
            {/* Current user info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    User ID: {user.id}
                  </p>
                </div>
                {user.is_superuser && (
                  <Badge variant="destructive">Super Admin</Badge>
                )}
              </div>
            </div>

            {/* Selected roles */}
            <div>
              <p className="text-sm font-medium mb-2">Selected Roles ({selectedRoles.size})</p>
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {selectedRoles.size === 0 ? (
                  <span className="text-sm text-muted-foreground">No roles selected</span>
                ) : (
                  Array.from(selectedRoles).map(roleId => {
                    const role = availableRoles.find(r => r.id === roleId);
                    return role ? (
                      <Badge key={roleId} variant="secondary">
                        {role.name}
                        <button
                          type="button"
                          onClick={() => handleRoleToggle(roleId, false)}
                          className="ml-1 hover:text-destructive"
                          disabled={loading}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })
                )}
              </div>
            </div>

            <Separator />

            {/* Available roles */}
            <div>
              <p className="text-sm font-medium mb-2">Available Roles</p>
              <ScrollArea className="h-[250px] w-full rounded-md border p-4">
                <div className="space-y-3">
                  {availableRoles.map(role => (
                    <div
                      key={role.id}
                      className="flex items-start space-x-3 py-2"
                    >
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={selectedRoles.has(role.id)}
                        onCheckedChange={(checked) =>
                          handleRoleToggle(role.id, checked as boolean)
                        }
                        disabled={loading}
                      />
                      <div className="flex-1 space-y-1">
                        <label
                          htmlFor={`role-${role.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {role.name}
                        </label>
                        {role.description && (
                          <p className="text-xs text-muted-foreground">
                            {role.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {getRolePermissionCount(role)} permission(s)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {user.is_superuser && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  This user is a Super Admin and has all permissions regardless of assigned roles.
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