'use client';

import { useGuestOnly } from '@/contexts/auth-context';
import { LoginForm } from '@/components/auth/login-form';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Smartphone } from 'lucide-react';
import { translations } from '@/lib/translations';

export default function LoginPage(): JSX.Element {
  const { isLoading } = useGuestOnly('/dashboard');

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-600'></div>
      </div>
    );
  }

  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      
      <div className='flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-green-50 via-white to-green-50'>
        <div className='w-full max-w-md'>
          <div className='text-center mb-8'>
            <div className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-4'>
              <Smartphone className='h-8 w-8 text-white' />
            </div>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              {translations.auth.login.title}
            </h2>
            <p className='text-gray-600'>
              {translations.auth.login.subtitle}
            </p>
          </div>
          
          <LoginForm />
        </div>
      </div>
      
      <Footer />
    </div>
  );
}