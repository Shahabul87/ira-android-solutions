'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, Loader2, Users } from 'lucide-react';
import { Role } from '@/types';
import AdminAPI from '@/lib/admin-api';

interface RoleDeleteDialogProps {
  role: Role;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RoleDeleteDialog({
  role,
  open,
  onClose,
  onSuccess,
}: RoleDeleteDialogProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await AdminAPI.deleteRole(role.id);

      if (response.success) {
        onSuccess();
      } else {
        throw new Error(response.error?.message || 'Failed to delete role');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirm Delete Role
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the role.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                You are about to delete:
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">Role Name:</span>{' '}
                  <span className="font-medium">{role.name}</span>
                </p>
                {role.description && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Description:</span>{' '}
                    <span className="font-medium">{role.description}</span>
                  </p>
                )}
                <p className="text-sm">
                  <span className="text-muted-foreground">Permissions:</span>{' '}
                  <span className="font-medium">{role.permissions?.length || 0}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Role ID:</span>{' '}
                  <span className="font-mono text-xs">{role.id}</span>
                </p>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Deleting this role will:
                <ul className="mt-2 list-disc list-inside text-sm">
                  <li>Remove this role from all users who have it</li>
                  <li>Delete all permission assignments for this role</li>
                  <li>This action is permanent and cannot be undone</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> If users only have this role, they will lose all permissions and may not be able to access the system. Make sure affected users have alternative roles assigned.
              </AlertDescription>
            </Alert>
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
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}