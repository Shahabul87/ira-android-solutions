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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { CreateUserRequest } from '@/types/admin.types';
import { Role } from '@/types';
import AdminAPI from '@/lib/admin-api';
import { isValidEmail } from '@/lib/utils';

interface UserCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserCreateDialog({
  open,
  onClose,
  onSuccess,
}: UserCreateDialogProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    is_active: true,
    is_verified: false,
    is_superuser: false,
    roles: [],
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load available roles
  useEffect(() => {
    const loadRoles = async (): Promise<void> => {
      try {
        const response = await AdminAPI.getAllRoles();
        if (response.success && response.data) {
          setRoles(response.data);
        }
      } catch {
        // Failed to load roles
      }
    };

    if (open) {
      loadRoles();
    }
  }, [open]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        is_active: true,
        is_verified: false,
        is_superuser: false,
        roles: [],
      });
      setSelectedRoles([]);
      setValidationErrors({});
      setError(null);
    }
  }, [open]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors['email'] = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      errors['email'] = 'Invalid email format';
    }

    if (!formData.password) {
      errors['password'] = 'Password is required';
    } else if (formData.password.length < 8) {
      errors['password'] = 'Password must be at least 8 characters';
    }

    if (!formData.first_name) {
      errors['first_name'] = 'First name is required';
    }

    if (!formData.last_name) {
      errors['last_name'] = 'Last name is required';
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
      const response = await AdminAPI.createUser({
        ...formData,
        roles: selectedRoles,
      });

      if (response.success) {
        onSuccess();
      } else {
        throw new Error(response.error?.message || 'Failed to create user');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle role selection
  const toggleRole = (roleId: string): void => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user account with specified roles and permissions
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
                <Label htmlFor="first_name">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
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
                <Label htmlFor="last_name">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
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
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
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
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                disabled={loading}
              />
              {validationErrors['password'] && (
                <p className="text-sm text-destructive">
                  {validationErrors['password']}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[50px]">
                {selectedRoles.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    No roles selected
                  </span>
                ) : (
                  selectedRoles.map((roleId) => {
                    const role = roles.find((r) => r.id === roleId);
                    return role ? (
                      <Badge key={roleId} variant="secondary">
                        {role.name}
                        <button
                          type="button"
                          onClick={() => toggleRole(roleId)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })
                )}
              </div>
              <Select onValueChange={(value) => toggleRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Add role..." />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((role) => !selectedRoles.includes(role.id))
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}