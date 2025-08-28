'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, Copy, Download, Shield, Smartphone, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface TwoFactorSetupData {
  secret: string;
  qr_code: string;
  backup_codes: string[];
  manual_entry_key: string;
  manual_entry_uri: string;
}

interface TwoFactorSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'intro' | 'setup' | 'verify' | 'backup' | 'complete'>('intro');
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [savedBackupCodes, setSavedBackupCodes] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiClient.post<TwoFactorSetupData>('/auth/2fa/setup');
      if (response.success && response.data) {
        setSetupData(response.data);
      }
      setStep('setup');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/2fa/enable', { code: verificationCode });
      setStep('backup');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;
    
    const content = `Enterprise Auth - Backup Codes
Generated: ${new Date().toISOString()}

IMPORTANT: Keep these codes safe! Each code can only be used once.

${setupData.backup_codes.join('\n')}

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

  const completeSetup = () => {
    if (!savedBackupCodes) {
      setError('Please save your backup codes before continuing');
      return;
    }
    setStep('complete');
    setTimeout(() => {
      onComplete?.();
    }, 2000);
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel?.()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication Setup
          </DialogTitle>
          <DialogDescription>
            Enhance your account security with two-factor authentication
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'intro' && (
          <Card>
            <CardHeader>
              <CardTitle>Secure Your Account</CardTitle>
              <CardDescription>
                Two-factor authentication adds an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 mt-1 text-primary" />
                <div>
                  <p className="font-medium">Enhanced Security</p>
                  <p className="text-sm text-muted-foreground">
                    Protect your account from unauthorized access even if your password is compromised
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 mt-1 text-primary" />
                <div>
                  <p className="font-medium">Authenticator App Required</p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll need an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              <Button onClick={startSetup} disabled={loading}>
                {loading ? 'Starting...' : 'Start Setup'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 'setup' && setupData && (
          <Card>
            <CardHeader>
              <CardTitle>Scan QR Code</CardTitle>
              <CardDescription>
                Use your authenticator app to scan this QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={setupData.qr_code} 
                  alt="2FA QR Code" 
                  className="max-w-[200px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Can&apos;t scan? Enter this code manually:</Label>
                <div className="flex gap-2">
                  <Input 
                    value={setupData.manual_entry_key} 
                    readOnly 
                    className="font-mono"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(setupData.manual_entry_key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {copiedSecret && (
                  <p className="text-sm text-green-600">Copied to clipboard!</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => setStep('verify')}
              >
                I&apos;ve Added the Account
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 'verify' && (
          <Card>
            <CardHeader>
              <CardTitle>Verify Setup</CardTitle>
              <CardDescription>
                Enter the 6-digit code from your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl font-mono tracking-widest"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setStep('setup')}
                disabled={loading}
              >
                Back
              </Button>
              <Button 
                onClick={verifyAndEnable}
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 'backup' && setupData && (
          <Card>
            <CardHeader>
              <CardTitle>Save Backup Codes</CardTitle>
              <CardDescription>
                These codes can be used to access your account if you lose your authenticator device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Each backup code can only be used once. Store them in a safe place!
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono">
                {setupData.backup_codes.map((code, index) => (
                  <div key={index} className="text-sm">
                    {index + 1}. {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const codes = setupData.backup_codes.join('\n');
                    copyToClipboard(codes);
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Codes
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={downloadBackupCodes}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Codes
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="saved"
                  checked={savedBackupCodes}
                  onChange={(e) => setSavedBackupCodes(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="saved" className="text-sm">
                  I have saved my backup codes in a secure location
                </Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={completeSetup}
                disabled={!savedBackupCodes}
              >
                Complete Setup
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 'complete' && (
          <Card>
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold">
                    Two-Factor Authentication Enabled!
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your account is now protected with two-factor authentication
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}