'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuthForm, validationRules, isFormValid } from '@/hooks/use-auth-form';
import AuthAPI from '@/lib/auth-api';
import { Loader2, User as UserIcon } from 'lucide-react';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
}

interface ProfileFormProps {
  onSuccess?: () => void;
}

export function ProfileForm({ onSuccess }: ProfileFormProps): JSX.Element {
  const { user, updateUser, isLoading } = useAuth();

  const { form, isSubmitting, error, handleSubmit } = useAuthForm<ProfileFormData>({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
    },
    onSuccess: async () => {
      if (onSuccess) {
        onSuccess();
      }
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      });
    }
  }, [user, form]);

  const onSubmit = handleSubmit(async (data: ProfileFormData): Promise<boolean> => {
    const response = await AuthAPI.updateProfile(data);
    
    if (response.success && response.data) {
      updateUser(response.data);
      return true;
    }
    
    return false;
  });

  const formIsValid = isFormValid(form, ['first_name', 'last_name', 'email']);
  const hasChanges = React.useMemo(() => {
    if (!user) return false;
    
    const currentValues = form.getValues();
    return (
      currentValues.first_name !== user.first_name ||
      currentValues.last_name !== user.last_name ||
      currentValues.email !== user.email
    );
  }, [form, user]);

  if (isLoading || !user) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center p-8'>
          <Loader2 className='h-8 w-8 animate-spin' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <UserIcon className='h-5 w-5' />
          Personal Information
        </CardTitle>
        <CardDescription>
          Update your personal details and contact information
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

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='first_name'
                rules={validationRules.firstName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter your first name'
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
                name='last_name'
                rules={validationRules.lastName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter your last name'
                        disabled={isSubmitting}
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
                      placeholder='Enter your email address'
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end space-x-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  if (user) {
                    form.reset({
                      first_name: user.first_name,
                      last_name: user.last_name,
                      email: user.email,
                    });
                  }
                }}
                disabled={isSubmitting || !hasChanges}
              >
                Cancel
              </Button>
              
              <Button
                type='submit'
                disabled={!formIsValid || isSubmitting || !hasChanges}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Saving...
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default ProfileForm;