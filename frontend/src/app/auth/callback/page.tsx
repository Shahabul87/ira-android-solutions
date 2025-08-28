'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/icons';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import AuthAPI from '@/lib/auth-api';

export default function OAuthCallbackPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  useAuth(); // Initialize auth context
  
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState<string>('Processing authentication...');

  useEffect(() => {
    const handleCallback = async (): Promise<void> => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Handle OAuth errors
      if (error) {
        setStatus('error');
        setMessage(errorDescription || `Authentication failed: ${error}`);
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        setStatus('error');
        setMessage('Invalid callback parameters. Please try again.');
        return;
      }

      try {
        // Exchange code for tokens
        const response = await AuthAPI.oauthCallback({
          code,
          state,
          redirect_uri: `${window.location.origin}/auth/callback`,
        });

        if (response.success && response.data) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          // Store tokens and redirect
          localStorage.setItem('auth_tokens', JSON.stringify(response.data));
          
          // Get user data
          const userResponse = await AuthAPI.getCurrentUser();
          if (userResponse.success && userResponse.data) {
            localStorage.setItem('auth_user', JSON.stringify(userResponse.data));
          }
          
          // Redirect to dashboard or intended page
          setTimeout(() => {
            const returnUrl = sessionStorage.getItem('oauth_return_url') || '/dashboard';
            sessionStorage.removeItem('oauth_return_url');
            router.push(returnUrl);
          }, 1500);
        } else {
          throw new Error(response.error?.message || 'Authentication failed');
        }
      } catch (err) {
        setStatus('error');
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setMessage(errorMessage);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>OAuth Authentication</CardTitle>
          <CardDescription>
            {status === 'processing' && 'Please wait while we complete your authentication...'}
            {status === 'success' && 'Authentication successful!'}
            {status === 'error' && 'Authentication failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {status === 'processing' && (
            <>
              <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <button
                onClick={() => router.push('/auth/login')}
                className="text-sm text-primary hover:underline"
              >
                Return to login
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}