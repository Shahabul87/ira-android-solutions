'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertCircle } from 'lucide-react';
import { Icons } from '@/components/icons';

interface OAuthProvidersProps {
  className?: string;
  onSuccess?: () => void;
}

interface OAuthProvider {
  name: string;
  id: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}

const providers: OAuthProvider[] = [
  {
    id: 'google',
    name: 'Google',
    icon: <Icons.google className="h-5 w-5" />,
    bgColor: 'bg-white hover:bg-gray-50',
    textColor: 'text-gray-700',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: <Icons.gitHub className="h-5 w-5" />,
    bgColor: 'bg-gray-900 hover:bg-gray-800',
    textColor: 'text-white',
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    icon: <Icons.microsoft className="h-5 w-5" />,
    bgColor: 'bg-blue-600 hover:bg-blue-700',
    textColor: 'text-white',
  },
];

export default function OAuthProviders({ className }: OAuthProvidersProps): JSX.Element {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthLogin = async (providerId: string): Promise<void> => {
    setLoading(providerId);
    setError(null);

    try {
      // Construct OAuth authorization URL
      const params = new URLSearchParams({
        provider: providerId,
        redirect_uri: `${window.location.origin}/auth/callback`,
        state: generateState(),
      });

      // Redirect to backend OAuth endpoint
      window.location.href = `${process.env['NEXT_PUBLIC_API_URL']}/api/v1/auth/oauth/authorize?${params}`;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth login failed';
      setError(errorMessage);
      setLoading(null);
    }
  };

  // Generate random state for OAuth security
  const generateState = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  return (
    <div className={className}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2">
        {providers.map((provider) => (
          <Button
            key={provider.id}
            variant="outline"
            className={`${provider.bgColor} ${provider.textColor} border`}
            onClick={() => handleOAuthLogin(provider.id)}
            disabled={loading !== null}
          >
            {loading === provider.id ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <span className="mr-2">{provider.icon}</span>
            )}
            Continue with {provider.name}
          </Button>
        ))}
      </div>
    </div>
  );
}