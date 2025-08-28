'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { LoginFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuthForm, validationRules, isFormValid } from '@/hooks/use-auth-form';
import { Loader2 } from 'lucide-react';
import OAuthProviders from './oauth-providers';
import { TwoFactorVerify } from './two-factor-verify';
import AuthAPI from '@/lib/auth-api';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps): JSX.Element {
  const { isLoading } = useAuth();
  const router = useRouter();
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [show2FA, setShow2FA] = useState(false);

  const { form, isSubmitting, error, setError, handleSubmit } = useAuthForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    onSuccess: async () => {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    },
  });

  const onSubmit = handleSubmit(async (data: LoginFormData): Promise<boolean> => {
    try {
      const response = await AuthAPI.login({
        email: data.email,
        password: data.password,
      });

      if (response.success) {
        if (response.data?.access_token && response.data?.refresh_token) {
          // Standard login success - tokens received
          if (onSuccess) {
            onSuccess();
          } else {
            router.push('/dashboard');
          }
          return true;
        } else if (response.data && 'requires_2fa' in response.data && 'temp_token' in response.data) {
          // 2FA required - show verification component
          const twoFAData = response.data as { requires_2fa: boolean; temp_token: string };
          setTempToken(twoFAData.temp_token);
          setShow2FA(true);
          return false; // Prevent form success handler
        }
      } else if (response.error) {
        setError(response.error.message || 'Login failed');
      }
      
      return false;
    } catch {
      setError('An error occurred during login');
      return false;
    }
  });

  const handle2FASuccess = (): void => {
    // Store tokens and redirect
    if (typeof window !== 'undefined') {
      // The auth context will handle token storage
      window.location.href = onSuccess ? '/' : '/dashboard';
    }
  };

  const handle2FACancel = (): void => {
    setShow2FA(false);
    setTempToken(null);
    form.reset();
  };

  const formIsValid = isFormValid(form, ['email', 'password']);

  // Show 2FA verification if needed
  if (show2FA && tempToken) {
    return (
      <TwoFactorVerify
        tempToken={tempToken}
        onSuccess={handle2FASuccess}
        onCancel={handle2FACancel}
      />
    );
  }

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl text-center'>Welcome back</CardTitle>
        <CardDescription className='text-center'>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name='email'
              rules={validationRules.email}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='Enter your email'
                      disabled={isLoading || isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='password'
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 1,
                  message: 'Password is required',
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder='Enter your password'
                      disabled={isLoading || isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex items-center justify-between'>
              <FormField
                control={form.control}
                name='rememberMe'
                render={({ field }) => (
                  <div className='flex items-center space-x-2'>
                    <input
                      id='remember'
                      type='checkbox'
                      className='h-4 w-4 rounded border-input'
                      disabled={isLoading || isSubmitting}
                      checked={field.value}
                      onChange={field.onChange}
                    />
                    <FormLabel 
                      htmlFor='remember' 
                      className='text-sm font-normal cursor-pointer'
                    >
                      Remember me
                    </FormLabel>
                  </div>
                )}
              />
              <Link
                href='/auth/forgot-password'
                className='text-sm text-primary hover:underline'
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type='submit'
              className='w-full'
              disabled={!formIsValid || isLoading || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </Form>

        <div className='text-center text-sm mt-4'>
          <span className='text-muted-foreground'>Don&apos;t have an account?</span>{' '}
          <Link href='/auth/register' className='text-primary hover:underline'>
            Sign up
          </Link>
        </div>

        <OAuthProviders className='mt-6' {...(onSuccess && { onSuccess })} />
      </CardContent>
    </Card>
  );
}

export default LoginForm;