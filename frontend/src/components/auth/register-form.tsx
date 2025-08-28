'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { RegisterFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator';
import { useAuthForm, validationRules, isFormValid } from '@/hooks/use-auth-form';
import { Loader2 } from 'lucide-react';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps): JSX.Element {
  const { register: registerUser, isLoading } = useAuth();
  const router = useRouter();

  const { form, isSubmitting, error, handleSubmit } = useAuthForm<RegisterFormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      first_name: '',
      last_name: '',
      terms: false,
    },
    onSuccess: async () => {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    },
  });

  const passwordValue = form.watch('password');

  const onSubmit = handleSubmit(async (data: RegisterFormData): Promise<boolean> => {
    return await registerUser({
      email: data.email,
      password: data.password,
      confirm_password: data.confirmPassword,
      first_name: data.first_name,
      last_name: data.last_name,
      agree_to_terms: data.terms,
    });
  });

  const formIsValid = isFormValid(form, ['email', 'password', 'confirmPassword', 'first_name', 'last_name', 'terms']);

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl text-center'>Create an account</CardTitle>
        <CardDescription className='text-center'>
          Enter your details to get started
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

            <div className='grid grid-cols-2 gap-2'>
              <FormField
                control={form.control}
                name='first_name'
                rules={validationRules.firstName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input
                        type='text'
                        placeholder='John'
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
                name='last_name'
                rules={validationRules.lastName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input
                        type='text'
                        placeholder='Doe'
                        disabled={isLoading || isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      placeholder='john@example.com'
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
              rules={validationRules.password}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder='Create a strong password'
                      disabled={isLoading || isSubmitting}
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
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder='Confirm your password'
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
              name='terms'
              rules={validationRules.terms}
              render={({ field }) => (
                <FormItem>
                  <div className='flex items-start space-x-2'>
                    <FormControl>
                      <input
                        id='terms'
                        type='checkbox'
                        className='mt-1 h-4 w-4 rounded border-input'
                        disabled={isLoading || isSubmitting}
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <div className='space-y-1'>
                      <FormLabel 
                        htmlFor='terms' 
                        className='text-sm font-normal cursor-pointer leading-none'
                      >
                        I agree to the{' '}
                        <Link href='/terms' className='text-primary hover:underline'>
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href='/privacy' className='text-primary hover:underline'>
                          Privacy Policy
                        </Link>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </div>
                </FormItem>
              )}
            />

          <Button
            type='submit'
            className='w-full'
            disabled={!formIsValid || isLoading || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>

          <div className='text-center text-sm mt-4'>
            <span className='text-muted-foreground'>Already have an account?</span>{' '}
            <Link href='/auth/login' className='text-primary hover:underline'>
              Sign in
            </Link>
          </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default RegisterForm;