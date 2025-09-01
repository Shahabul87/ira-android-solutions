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
import { translations } from '@/lib/translations';

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
    <Card className='w-full max-w-md mx-auto shadow-xl border-0'>
      <CardHeader className='space-y-1 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-t-lg'>
        <CardTitle className='text-2xl text-center'>{translations.auth.register.title}</CardTitle>
        <CardDescription className='text-center text-green-50'>
          {translations.auth.register.subtitle}
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

            <div className='grid grid-cols-2 gap-2'>
              <FormField
                control={form.control}
                name='first_name'
                rules={validationRules.firstName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>প্রথম নাম</FormLabel>
                    <FormControl>
                      <Input
                        type='text'
                        placeholder='রহিম'
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
                name='last_name'
                rules={validationRules.lastName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>শেষ নাম</FormLabel>
                    <FormControl>
                      <Input
                        type='text'
                        placeholder='উদ্দিন'
                        disabled={isLoading || isSubmitting}
                        className='border-gray-300 focus:border-green-500'
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
                  <FormLabel>{translations.auth.register.email}</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='আপনার ইমেইল ঠিকানা'
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
              rules={validationRules.password}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.auth.register.password}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder='শক্তিশালী পাসওয়ার্ড তৈরি করুন'
                      disabled={isLoading || isSubmitting}
                      className='border-gray-300 focus:border-green-500'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  {passwordValue && <PasswordStrengthIndicator password={passwordValue} />}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='confirmPassword'
              rules={{
                required: 'পাসওয়ার্ড নিশ্চিতকরণ আবশ্যক',
                validate: (value) => value === passwordValue || 'পাসওয়ার্ড মিলছে না'
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.auth.register.confirmPassword}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder='পাসওয়ার্ড পুনরায় লিখুন'
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
              name='terms'
              rules={{ required: 'আপনাকে শর্তাবলী মেনে নিতে হবে' }}
              render={({ field }) => (
                <div className='flex items-start space-x-2'>
                  <input
                    id='terms'
                    type='checkbox'
                    className='h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 mt-1'
                    disabled={isLoading || isSubmitting}
                    checked={field.value}
                    onChange={field.onChange}
                  />
                  <FormLabel 
                    htmlFor='terms' 
                    className='text-sm font-normal cursor-pointer leading-relaxed'
                  >
                    {translations.auth.register.terms}
                  </FormLabel>
                </div>
              )}
            />

            <Button
              type='submit'
              className='w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
              disabled={!formIsValid || isLoading || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  নিবন্ধন হচ্ছে...
                </>
              ) : (
                translations.auth.register.submit
              )}
            </Button>
          </form>
        </Form>

        <div className='text-center text-sm mt-6 pt-6 border-t border-gray-100'>
          <span className='text-gray-600'>{translations.auth.register.haveAccount}</span>{' '}
          <Link href='/auth/login' className='text-green-600 hover:text-green-700 font-semibold hover:underline'>
            {translations.auth.register.signIn}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default RegisterForm;