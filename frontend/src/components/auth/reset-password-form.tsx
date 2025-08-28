'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator';
import { useAuthForm, validationRules } from '@/hooks/use-auth-form';
import AuthAPI from '@/lib/auth-api';
import { Loader2, CheckCircle } from 'lucide-react';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

interface ResetPasswordFormProps {
  token: string;
  onSuccess?: () => void;
}

export function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps): JSX.Element {
  const router = useRouter();
  const [isComplete, setIsComplete] = React.useState<boolean>(false);

  const { form, isSubmitting, error, handleSubmit } = useAuthForm<ResetPasswordFormData>({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    onSuccess: async () => {
      setIsComplete(true);
      if (onSuccess) {
        onSuccess();
      }
    },
  });

  const passwordValue = form.watch('password');

  const onSubmit = handleSubmit(async (data: ResetPasswordFormData): Promise<boolean> => {
    const response = await AuthAPI.confirmPasswordReset({
      token,
      new_password: data.password,
    });
    return response.success;
  });

  if (isComplete) {
    return (
      <Card className='w-full max-w-md mx-auto'>
        <CardHeader className='space-y-1 text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
            <CheckCircle className='h-6 w-6 text-green-600' />
          </div>
          <CardTitle className='text-2xl'>Password reset successful</CardTitle>
          <CardDescription>
            Your password has been successfully updated. You can now sign in with your new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => router.push('/auth/login')}
            className='w-full'
          >
            Sign in to your account
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card className='w-full max-w-md mx-auto'>
        <CardHeader className='space-y-1 text-center'>
          <CardTitle className='text-2xl'>Invalid reset link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-sm text-muted-foreground'>
            <p>Password reset links expire after 1 hour for security reasons.</p>
          </div>
          
          <div className='flex flex-col space-y-2'>
            <Button
              onClick={() => router.push('/auth/forgot-password')}
              className='w-full'
            >
              Request new reset link
            </Button>
            
            <Button
              onClick={() => router.push('/auth/login')}
              variant='outline'
              className='w-full'
            >
              Back to sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl text-center'>Set new password</CardTitle>
        <CardDescription className='text-center'>
          Enter your new password below
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
              name='password'
              rules={validationRules.password}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder='Create a strong password'
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <PasswordStrengthIndicator password={passwordValue} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='confirmPassword'
              rules={validationRules.confirmPassword(passwordValue)}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder='Confirm your new password'
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type='submit'
              className='w-full'
              disabled={isSubmitting || !form.formState.isValid}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Updating password...
                </>
              ) : (
                'Update password'
              )}
            </Button>

            <div className='text-center text-sm'>
              <span className='text-muted-foreground'>Remember your password?</span>{' '}
              <Link href='/auth/login' className='text-primary hover:underline'>
                Back to sign in
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default ResetPasswordForm;