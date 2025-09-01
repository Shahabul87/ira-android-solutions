'use client';

import { useGuestOnly } from '@/contexts/auth-context';
import { RegisterForm } from '@/components/auth/register-form';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { UserPlus } from 'lucide-react';
import { translations } from '@/lib/translations';

export default function RegisterPage(): JSX.Element {
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
              <UserPlus className='h-8 w-8 text-white' />
            </div>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              {translations.auth.register.title}
            </h2>
            <p className='text-gray-600'>
              {translations.auth.register.subtitle}
            </p>
          </div>
          
          <RegisterForm />
        </div>
      </div>
      
      <Footer />
    </div>
  );
}