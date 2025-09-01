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
import { translations } from '@/lib/translations';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps): JSX.Element {
  const { login, isLoading } = useAuth();
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
      // Use auth context login which handles token storage
      const success = await login({
        email: data.email,
        password: data.password,
      });

      if (success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/dashboard');
        }
        return true;
      } else {
        setError(translations.auth.errors.invalidCredentials);
        return false;
      }
    } catch {
      setError('লগইনে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
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
    <Card className='w-full max-w-md mx-auto shadow-xl border-0'>
      <CardHeader className='space-y-1 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-t-lg'>
        <CardTitle className='text-2xl text-center'>{translations.auth.login.title}</CardTitle>
        <CardDescription className='text-center text-green-50'>
          {translations.auth.login.subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent className='pt-6'>
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
                  <FormLabel>{translations.auth.login.email}</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='আপনার ইমেইল লিখুন'
                      disabled={isLoading || isSubmitting}
                      className='border-gray-300 focus:border-green-500'
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
                required: 'পাসওয়ার্ড আবশ্যক',
                minLength: {
                  value: 1,
                  message: 'পাসওয়ার্ড আবশ্যক',
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.auth.login.password}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder='আপনার পাসওয়ার্ড লিখুন'
                      disabled={isLoading || isSubmitting}
                      className='border-gray-300 focus:border-green-500'
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
                      className='h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500'
                      disabled={isLoading || isSubmitting}
                      checked={field.value}
                      onChange={field.onChange}
                    />
                    <FormLabel 
                      htmlFor='remember' 
                      className='text-sm font-normal cursor-pointer'
                    >
                      {translations.auth.login.rememberMe}
                    </FormLabel>
                  </div>
                )}
              />
              <Link
                href='/auth/forgot-password'
                className='text-sm text-green-600 hover:text-green-700 hover:underline'
              >
                {translations.auth.login.forgotPassword}
              </Link>
            </div>

            <Button
              type='submit'
              className='w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
              disabled={!formIsValid || isLoading || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  লগইন হচ্ছে...
                </>
              ) : (
                translations.auth.login.submit
              )}
            </Button>
          </form>
        </Form>

        <div className='relative my-6'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-gray-200'></div>
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='bg-white px-2 text-gray-500'>{translations.auth.login.or}</span>
          </div>
        </div>

        <OAuthProviders className='mb-4' {...(onSuccess && { onSuccess })} />

        <div className='text-center text-sm mt-6 pt-6 border-t border-gray-100'>
          <span className='text-gray-600'>{translations.auth.login.noAccount}</span>{' '}
          <Link href='/auth/register' className='text-green-600 hover:text-green-700 font-semibold hover:underline'>
            {translations.auth.login.signUp}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default LoginForm;