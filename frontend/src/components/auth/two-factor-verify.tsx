'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Smartphone, Key, AlertCircle, ArrowLeft } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface TwoFactorVerifyProps {
  tempToken: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function TwoFactorVerify({ tempToken, onSuccess, onCancel }: TwoFactorVerifyProps) {
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState<'totp' | 'backup'>('totp');

  const handleVerify = async () => {
    const verificationCode = method === 'totp' ? code : backupCode;
    
    if (!verificationCode) {
      setError('Please enter a verification code');
      return;
    }

    if (method === 'totp' && verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    if (method === 'backup' && !verificationCode.includes('-')) {
      setError('Invalid backup code format');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post<{ access_token: string; refresh_token: string }>('/auth/2fa/verify-login', {
        temp_token: tempToken,
        code: verificationCode,
        is_backup: method === 'backup'
      });

      if (response.success && response.data?.access_token && response.data?.refresh_token) {
        onSuccess();
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { detail?: string } } };
      if (error.response?.status === 429) {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(error.response?.data?.detail || 'Invalid verification code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Enter your verification code to complete sign in
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={method} onValueChange={(v) => setMethod(v as 'totp' | 'backup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="totp">
              <Smartphone className="h-4 w-4 mr-2" />
              Authenticator App
            </TabsTrigger>
            <TabsTrigger value="backup">
              <Key className="h-4 w-4 mr-2" />
              Backup Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="totp" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totp-code">6-Digit Code</Label>
              <Input
                id="totp-code"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                onKeyPress={handleKeyPress}
                className="text-center text-2xl font-mono tracking-widest"
                autoComplete="one-time-code"
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Enter the code from your authenticator app
              </p>
            </div>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-code">Backup Code</Label>
              <Input
                id="backup-code"
                type="text"
                placeholder="XXXX-XXXX"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="font-mono tracking-wider"
              />
              <p className="text-sm text-muted-foreground">
                Enter one of your backup recovery codes
              </p>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Each backup code can only be used once. After using a backup code, 
                you should generate new ones from your security settings.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleVerify}
          disabled={loading || (method === 'totp' ? code.length !== 6 : !backupCode)}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </Button>
      </CardFooter>
    </Card>
  );
}