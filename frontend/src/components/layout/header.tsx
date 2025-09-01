'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, Smartphone, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { translations } from '@/lib/translations';
import { useAuth } from '@/contexts/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header(): JSX.Element {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: translations.nav.home },
    { href: '/services', label: translations.nav.services },
    { href: '/portfolio', label: translations.nav.portfolio },
    { href: '/about', label: translations.nav.about },
    { href: '/blog', label: translations.nav.blog },
    { href: '/contact', label: translations.nav.contact },
  ];

  const handleLogout = async (): Promise<void> => {
    await logout();
    router.push('/');
  };

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 animate-slideDown'>
      <div className='container mx-auto px-4'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <Link href='/' className='flex items-center space-x-2'>
            <div className='bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg'>
              <Smartphone className='h-6 w-6 text-white' />
            </div>
            <div>
              <span className='text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent'>
                {translations.company.shortName}
              </span>
              <span className='text-xs block text-gray-600 -mt-1'>
                অ্যান্ড্রয়েড সলিউশনস
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className='hidden lg:flex items-center space-x-8'>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-green-600 ${
                  pathname === item.href
                    ? 'text-green-600 border-b-2 border-green-600 pb-1'
                    : 'text-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className='hidden lg:flex items-center space-x-4'>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' className='flex items-center space-x-2'>
                    <span>{user ? `${user.first_name} ${user.last_name}`.trim() : 'ইউজার'}</span>
                    <ChevronDown className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-48'>
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    {translations.nav.dashboard}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    {translations.nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant='outline'
                  onClick={() => router.push('/auth/login')}
                  className='border-green-600 text-green-600 hover:bg-green-50'
                >
                  {translations.nav.login}
                </Button>
                <Button
                  onClick={() => router.push('/auth/register')}
                  className='bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                >
                  {translations.cta.getQuote}
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='lg:hidden p-2 rounded-md hover:bg-gray-100'
          >
            {isMobileMenuOpen ? (
              <X className='h-6 w-6 text-gray-700' />
            ) : (
              <Menu className='h-6 w-6 text-gray-700' />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className='lg:hidden border-t bg-white'>
          <nav className='flex flex-col p-4 space-y-2'>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-green-50 text-green-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className='pt-4 border-t space-y-2'>
              {isAuthenticated ? (
                <>
                  <Link
                    href='/dashboard'
                    onClick={() => setIsMobileMenuOpen(false)}
                    className='block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'
                  >
                    {translations.nav.dashboard}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className='w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'
                  >
                    {translations.nav.logout}
                  </button>
                </>
              ) : (
                <>
                  <Button
                    variant='outline'
                    onClick={() => {
                      router.push('/auth/login');
                      setIsMobileMenuOpen(false);
                    }}
                    className='w-full border-green-600 text-green-600'
                  >
                    {translations.nav.login}
                  </Button>
                  <Button
                    onClick={() => {
                      router.push('/auth/register');
                      setIsMobileMenuOpen(false);
                    }}
                    className='w-full bg-gradient-to-r from-green-600 to-green-700'
                  >
                    {translations.cta.getQuote}
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}