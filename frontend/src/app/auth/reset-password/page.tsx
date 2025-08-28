'use client';

import { useSearchParams } from 'next/navigation';
import { useGuestOnly } from '@/contexts/auth-context';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { Suspense } from 'react';

function ResetPasswordContent(): JSX.Element {
  const { isLoading } = useGuestOnly('/dashboard');
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
      </div>
    );
  }

  return (
    <div className='flex flex-col min-h-screen bg-muted/50'>
      <header className='border-b bg-background'>
        <div className='container mx-auto px-4 py-4'>
          <h1 className='text-xl font-bold text-primary'>
            Enterprise Auth Template
          </h1>
        </div>
      </header>

      <div className='flex-1 flex items-center justify-center p-4'>
        <div className='w-full max-w-md'>
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage(): JSX.Element {
  return (
    <Suspense fallback={
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}