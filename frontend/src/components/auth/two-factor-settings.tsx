'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ShieldOff, RefreshCw, Download, Copy, AlertCircle, CheckCircle2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { TwoFactorSetup } from './two-factor-setup';

interface TwoFactorStatus {
  enabled: boolean;
  verified_at: string | null;
  backup_codes_remaining: number;
  methods: {
    totp: boolean;
    backup_codes: boolean;
    webauthn: boolean;
  };
}

export function TwoFactorSettings() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [password, setPassword] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await apiClient.get<TwoFactorStatus>('/auth/2fa/status');
      if (response.success && response.data) {
        setStatus(response.data);
      }
    } catch {
      setError('Failed to fetch 2FA status');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/2fa/disable', { password });
      await fetchStatus();
      setShowDisable(false);
      setPassword('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to disable 2FA');
    } finally {
      setActionLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    setActionLoading(true);
    setError('');

    try {
      const response = await apiClient.post<{ backup_codes: string[] }>('/auth/2fa/backup-codes/regenerate');
      if (response.success && response.data) {
        setNewBackupCodes(response.data.backup_codes);
      }
      setShowBackupCodes(true);
      await fetchStatus();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to regenerate backup codes');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = `Enterprise Auth - Backup Codes
Generated: ${new Date().toISOString()}

IMPORTANT: Keep these codes safe! Each code can only be used once.

${newBackupCodes.join('\n')}

Store these codes in a secure location separate from your authenticator device.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enterprise-auth-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(newBackupCodes.join('\n'));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Loading 2FA settings...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
            <Badge variant={status.enabled ? 'default' : 'outline'}>
              {status.enabled ? (
                <>
                  <Shield className="h-3 w-3 mr-1" />
                  Enabled
                </>
              ) : (
                <>
                  <ShieldOff className="h-3 w-3 mr-1" />
                  Disabled
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {status.enabled ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Authenticator App</p>
                    <p className="text-sm text-muted-foreground">
                      {status.methods.totp ? 'Configured' : 'Not configured'}
                    </p>
                  </div>
                  {status.methods.totp && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Backup Codes</p>
                    <p className="text-sm text-muted-foreground">
                      {status.backup_codes_remaining} codes remaining
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={regenerateBackupCodes}
                    disabled={actionLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>

                {status.backup_codes_remaining < 3 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You have only {status.backup_codes_remaining} backup codes remaining. 
                      Consider regenerating new codes.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  Enabled on: {status.verified_at ? new Date(status.verified_at).toLocaleDateString() : 'Unknown'}
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setShowDisable(true)}
                  className="w-full"
                >
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Disable Two-Factor Authentication
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">
                Protect your account with two-factor authentication
              </p>
              <Button onClick={() => setShowSetup(true)}>
                <Shield className="h-4 w-4 mr-2" />
                Enable Two-Factor Authentication
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      {showSetup && (
        <TwoFactorSetup
          onComplete={() => {
            setShowSetup(false);
            fetchStatus();
          }}
          onCancel={() => setShowSetup(false)}
        />
      )}

      {/* Disable Confirmation Dialog */}
      <Dialog open={showDisable} onOpenChange={setShowDisable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              This will make your account less secure. Enter your password to confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Disabling 2FA will remove the extra security layer from your account. 
                Your account will only be protected by your password.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDisable(false);
                setPassword('');
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={actionLoading || !password}
            >
              {actionLoading ? 'Disabling...' : 'Disable 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Backup Codes</DialogTitle>
            <DialogDescription>
              Save these codes in a secure location. Each code can only be used once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {newBackupCodes.map((code, index) => (
                <div key={index}>
                  {index + 1}. {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={copyBackupCodes}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={downloadBackupCodes}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowBackupCodes(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}