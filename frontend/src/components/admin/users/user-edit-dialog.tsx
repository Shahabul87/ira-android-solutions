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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { User } from '@/types';
import { UpdateUserRequest } from '@/types/admin.types';
import AdminAPI from '@/lib/admin-api';
import { isValidEmail } from '@/lib/utils';

interface UserEditDialogProps {
  user: User;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserEditDialog({
  user,
  open,
  onClose,
  onSuccess,
}: UserEditDialogProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<UpdateUserRequest>({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    is_active: user.is_active,
    is_verified: user.is_verified,
    is_superuser: user.is_superuser,
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset form when user changes
  useEffect(() => {
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      is_active: user.is_active,
      is_verified: user.is_verified,
      is_superuser: user.is_superuser,
    });
    setValidationErrors({});
    setError(null);
  }, [user]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.email && !isValidEmail(formData.email)) {
      errors['email'] = 'Invalid email format';
    }

    if (formData.first_name && formData.first_name.length < 1) {
      errors['first_name'] = 'First name cannot be empty';
    }

    if (formData.last_name && formData.last_name.length < 1) {
      errors['last_name'] = 'Last name cannot be empty';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if any changes were made
  const hasChanges = (): boolean => {
    return (
      formData.first_name !== user.first_name ||
      formData.last_name !== user.last_name ||
      formData.email !== user.email ||
      formData.is_active !== user.is_active ||
      formData.is_verified !== user.is_verified ||
      formData.is_superuser !== user.is_superuser
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
      const response = await AdminAPI.updateUser(user.id, formData);

      if (response.success) {
        onSuccess();
      } else {
        throw new Error(response.error?.message || 'Failed to update user');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
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
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user account details and settings
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  disabled={loading}
                />
                {validationErrors['first_name'] && (
                  <p className="text-sm text-destructive">
                    {validationErrors['first_name']}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  disabled={loading}
                />
                {validationErrors['last_name'] && (
                  <p className="text-sm text-destructive">
                    {validationErrors['last_name']}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={loading}
              />
              {validationErrors['email'] && (
                <p className="text-sm text-destructive">
                  {validationErrors['email']}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>User ID</Label>
              <Input value={user.id} disabled />
              <p className="text-xs text-muted-foreground">
                This cannot be changed
              </p>
            </div>

            <div className="space-y-3">
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
                  Active Account
                </Label>
                <span className="text-xs text-muted-foreground">
                  (User can log in)
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_verified"
                  checked={formData.is_verified || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_verified: checked as boolean })
                  }
                  disabled={loading}
                />
                <Label
                  htmlFor="is_verified"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Email Verified
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_superuser"
                  checked={formData.is_superuser || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_superuser: checked as boolean })
                  }
                  disabled={loading}
                />
                <Label
                  htmlFor="is_superuser"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Super Admin
                </Label>
                <span className="text-xs text-muted-foreground">
                  (Has all permissions)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Last Login</Label>
                <p className="text-sm">
                  {user.last_login
                    ? new Date(user.last_login).toLocaleDateString()
                    : 'Never'}
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