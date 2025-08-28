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
import { AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { User } from '@/types';
import AdminAPI from '@/lib/admin-api';

interface UserDeleteDialogProps {
  user: User;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserDeleteDialog({
  user,
  open,
  onClose,
  onSuccess,
}: UserDeleteDialogProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await AdminAPI.deleteUser(user.id);

      if (response.success) {
        onSuccess();
      } else {
        throw new Error(response.error?.message || 'Failed to delete user');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
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
            Confirm Delete User
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the user account.
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
                  <span className="text-muted-foreground">Name:</span>{' '}
                  <span className="font-medium">
                    {user.first_name} {user.last_name}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Email:</span>{' '}
                  <span className="font-medium">{user.email}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">User ID:</span>{' '}
                  <span className="font-mono text-xs">{user.id}</span>
                </p>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> All data associated with this user will be permanently deleted, including:
                <ul className="mt-2 list-disc list-inside text-sm">
                  <li>User profile and settings</li>
                  <li>Session data and login history</li>
                  <li>Role assignments and permissions</li>
                  <li>Audit logs will be retained for compliance</li>
                </ul>
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
            Delete User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}