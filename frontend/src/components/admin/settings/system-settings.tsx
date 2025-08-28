'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertCircle,
  Save,
  RefreshCw,
  Shield,
  Lock,
  Settings,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { SystemSettings, UpdateSystemSettingsRequest } from '@/types/admin.types';
import AdminAPI from '@/lib/admin-api';
import { useAuth } from '@/contexts/auth-context';

interface SystemSettingsProps {
  className?: string;
}

export default function SystemSettingsPanel({ className }: SystemSettingsProps): JSX.Element {
  const { hasPermission } = useAuth();
  
  // State management
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  
  // Form state
  const [formData, setFormData] = useState<UpdateSystemSettingsRequest>({});

  // Check permissions
  const canRead = hasPermission('system_settings:read');
  const canUpdate = hasPermission('system_settings:update');

  // Load settings
  const loadSettings = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await AdminAPI.getSystemSettings();

      if (response.success && response.data) {
        setSettings(response.data);
        setFormData(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to load system settings');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load system settings';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load settings on mount
  useEffect(() => {
    if (canRead) {
      loadSettings();
    }
  }, [canRead]);

  // Check for changes
  useEffect(() => {
    if (!settings) {
      setHasChanges(false);
      return;
    }

    const changed = Object.keys(formData).some(
      key => formData[key as keyof UpdateSystemSettingsRequest] !== settings[key as keyof SystemSettings]
    );
    setHasChanges(changed);
  }, [formData, settings]);

  // Handle save
  const handleSave = async (): Promise<void> => {
    if (!hasChanges || !canUpdate) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await AdminAPI.updateSystemSettings(formData);

      if (response.success && response.data) {
        setSettings(response.data);
        setFormData(response.data);
        setSuccess('System settings updated successfully');
        setHasChanges(false);
      } else {
        throw new Error(response.error?.message || 'Failed to update system settings');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update system settings';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Handle reset
  const handleReset = (): void => {
    if (settings) {
      setFormData(settings);
      setHasChanges(false);
    }
  };

  // Update form field
  const updateField = <K extends keyof UpdateSystemSettingsRequest>(
    field: K,
    value: UpdateSystemSettingsRequest[K]
  ): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!canRead) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don&apos;t have permission to view system settings.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load system settings</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure system-wide settings and security policies
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="secondary">Unsaved changes</Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges || saving}
              >
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || !canUpdate || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Success/Error messages */}
          {success && (
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="authentication">Authentication</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">General Settings</h3>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="registration_enabled">User Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to register accounts
                    </p>
                  </div>
                  <Switch
                    id="registration_enabled"
                    checked={formData.registration_enabled || false}
                    onCheckedChange={(checked) => updateField('registration_enabled', checked)}
                    disabled={!canUpdate}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_verification_required">Email Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Require email verification for new accounts
                    </p>
                  </div>
                  <Switch
                    id="email_verification_required"
                    checked={formData.email_verification_required || false}
                    onCheckedChange={(checked) => updateField('email_verification_required', checked)}
                    disabled={!canUpdate}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="password_reset_enabled">Password Reset</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to reset their passwords
                    </p>
                  </div>
                  <Switch
                    id="password_reset_enabled"
                    checked={formData.password_reset_enabled || false}
                    onCheckedChange={(checked) => updateField('password_reset_enabled', checked)}
                    disabled={!canUpdate}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="authentication" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Authentication Settings
                </h3>
                <Separator />
                
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                      <Input
                        id="max_login_attempts"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.max_login_attempts || 5}
                        onChange={(e) => updateField('max_login_attempts', parseInt(e.target.value, 10))}
                        disabled={!canUpdate}
                      />
                      <p className="text-xs text-muted-foreground">
                        Number of failed attempts before lockout
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lockout_duration">Lockout Duration (minutes)</Label>
                      <Input
                        id="lockout_duration"
                        type="number"
                        min="1"
                        max="1440"
                        value={formData.lockout_duration || 30}
                        onChange={(e) => updateField('lockout_duration', parseInt(e.target.value, 10))}
                        disabled={!canUpdate}
                      />
                      <p className="text-xs text-muted-foreground">
                        How long to lock accounts after max attempts
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session_timeout"
                      type="number"
                      min="5"
                      max="10080"
                      value={formData.session_timeout || 60}
                      onChange={(e) => updateField('session_timeout', parseInt(e.target.value, 10))}
                      disabled={!canUpdate}
                    />
                    <p className="text-xs text-muted-foreground">
                      Inactive session timeout duration
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security Policies
                </h3>
                <Separator />
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password_min_length">Minimum Password Length</Label>
                    <Input
                      id="password_min_length"
                      type="number"
                      min="6"
                      max="32"
                      value={formData.password_min_length || 8}
                      onChange={(e) => updateField('password_min_length', parseInt(e.target.value, 10))}
                      disabled={!canUpdate}
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Password Requirements</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password_require_uppercase">
                          Require uppercase letters
                        </Label>
                        <Switch
                          id="password_require_uppercase"
                          checked={formData.password_require_uppercase || false}
                          onCheckedChange={(checked) => updateField('password_require_uppercase', checked)}
                          disabled={!canUpdate}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="password_require_lowercase">
                          Require lowercase letters
                        </Label>
                        <Switch
                          id="password_require_lowercase"
                          checked={formData.password_require_lowercase || false}
                          onCheckedChange={(checked) => updateField('password_require_lowercase', checked)}
                          disabled={!canUpdate}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="password_require_numbers">
                          Require numbers
                        </Label>
                        <Switch
                          id="password_require_numbers"
                          checked={formData.password_require_numbers || false}
                          onCheckedChange={(checked) => updateField('password_require_numbers', checked)}
                          disabled={!canUpdate}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="password_require_symbols">
                          Require special characters
                        </Label>
                        <Switch
                          id="password_require_symbols"
                          checked={formData.password_require_symbols || false}
                          onCheckedChange={(checked) => updateField('password_require_symbols', checked)}
                          disabled={!canUpdate}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Maintenance Mode
                </h3>
                <Separator />
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    When maintenance mode is enabled, only administrators can access the system.
                    Regular users will see the maintenance message.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance_mode">Enable Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable access for non-admin users
                    </p>
                  </div>
                  <Switch
                    id="maintenance_mode"
                    checked={formData.maintenance_mode || false}
                    onCheckedChange={(checked) => updateField('maintenance_mode', checked)}
                    disabled={!canUpdate}
                  />
                </div>

                {formData.maintenance_mode && (
                  <div className="space-y-2">
                    <Label htmlFor="maintenance_message">Maintenance Message</Label>
                    <Textarea
                      id="maintenance_message"
                      value={formData.maintenance_message || ''}
                      onChange={(e) => updateField('maintenance_message', e.target.value)}
                      placeholder="System is currently under maintenance. Please check back later."
                      rows={4}
                      disabled={!canUpdate}
                    />
                    <p className="text-xs text-muted-foreground">
                      This message will be displayed to users during maintenance
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}