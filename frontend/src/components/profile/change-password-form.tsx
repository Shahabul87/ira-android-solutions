'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator';
import { useAuthForm, validationRules, isFormValid } from '@/hooks/use-auth-form';
import AuthAPI from '@/lib/auth-api';
import { Loader2, Shield, CheckCircle } from 'lucide-react';

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps): JSX.Element {
  const [isComplete, setIsComplete] = React.useState<boolean>(false);

  const { form, isSubmitting, error, handleSubmit } = useAuthForm<ChangePasswordFormData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    onSuccess: async () => {
      setIsComplete(true);
      setTimeout(() => {
        setIsComplete(false);
        form.reset();
      }, 3000);
      
      if (onSuccess) {
        onSuccess();
      }
    },
  });

  const newPasswordValue = form.watch('newPassword');

  const onSubmit = handleSubmit(async (data: ChangePasswordFormData): Promise<boolean> => {
    const response = await AuthAPI.changePassword({
      current_password: data.currentPassword,
      new_password: data.newPassword,
    });
    
    return response.success;
  });

  const formIsValid = isFormValid(form, ['currentPassword', 'newPassword', 'confirmNewPassword']);

  if (isComplete) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center p-8'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
            <CheckCircle className='h-6 w-6 text-green-600' />
          </div>
          <h3 className='text-lg font-semibold text-center mb-2'>Password changed successfully</h3>
          <p className='text-sm text-muted-foreground text-center'>
            Your password has been updated. Please use your new password for future logins.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Shield className='h-5 w-5' />
          Change Password
        </CardTitle>
        <CardDescription>
          Update your password to keep your account secure
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
              name='currentPassword'
              rules={{
                required: 'Current password is required',
                minLength: {
                  value: 1,
                  message: 'Current password is required',
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder='Enter your current password'
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='newPassword'
              rules={validationRules.password}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder='Create a strong new password'
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <PasswordStrengthIndicator password={newPasswordValue} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='confirmNewPassword'
              rules={validationRules.confirmPassword(newPasswordValue)}
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

            <div className='bg-muted/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium mb-2'>Password Requirements:</h4>
              <ul className='text-xs text-muted-foreground space-y-1'>
                <li>• At least 8 characters long</li>
                <li>• Contains uppercase and lowercase letters</li>
                <li>• Contains at least one number</li>
                <li>• Contains at least one special character</li>
                <li>• Different from your current password</li>
              </ul>
            </div>

            <div className='flex justify-end space-x-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              <Button
                type='submit'
                disabled={!formIsValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Changing password...
                  </>
                ) : (
                  'Change password'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default ChangePasswordForm;