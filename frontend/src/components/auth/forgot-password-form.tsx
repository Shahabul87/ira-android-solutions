'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuthForm, validationRules } from '@/hooks/use-auth-form';
import AuthAPI from '@/lib/auth-api';
import { Loader2, CheckCircle } from 'lucide-react';

interface ForgotPasswordFormData {
  email: string;
}

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps): JSX.Element {
  const router = useRouter();
  const [isComplete, setIsComplete] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState<string>('');

  const { form, isSubmitting, error, handleSubmit } = useAuthForm<ForgotPasswordFormData>({
    defaultValues: {
      email: '',
    },
    onSuccess: async (data) => {
      setEmail(data.email);
      setIsComplete(true);
      if (onSuccess) {
        onSuccess();
      }
    },
  });

  const onSubmit = handleSubmit(async (data: ForgotPasswordFormData): Promise<boolean> => {
    const response = await AuthAPI.requestPasswordReset({ email: data.email });
    return response.success;
  });

  if (isComplete) {
    return (
      <Card className='w-full max-w-md mx-auto'>
        <CardHeader className='space-y-1 text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
            <CheckCircle className='h-6 w-6 text-green-600' />
          </div>
          <CardTitle className='text-2xl'>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a password reset link to{' '}
            <span className='font-medium text-foreground'>{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-sm text-muted-foreground space-y-2'>
            <p>If you don&apos;t see the email in your inbox, please check your spam folder.</p>
            <p>The password reset link will expire in 1 hour for security reasons.</p>
          </div>
          
          <div className='flex flex-col space-y-2'>
            <Button
              onClick={() => {
                setIsComplete(false);
                form.reset();
              }}
              variant='outline'
              className='w-full'
            >
              Try another email
            </Button>
            
            <Button
              onClick={() => router.push('/auth/login')}
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
        <CardTitle className='text-2xl text-center'>Forgot your password?</CardTitle>
        <CardDescription className='text-center'>
          Enter your email address and we&apos;ll send you a link to reset your password
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
                      placeholder='Enter your email address'
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
                  Sending reset link...
                </>
              ) : (
                'Send reset link'
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

export default ForgotPasswordForm;