'use client';

import Link from 'next/link';
import { 
  Smartphone, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Github,
  Youtube,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { translations } from '@/lib/translations';

export function Footer(): JSX.Element {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: '/', label: translations.nav.home },
    { href: '/about', label: translations.nav.about },
    { href: '/portfolio', label: translations.nav.portfolio },
    { href: '/blog', label: translations.nav.blog },
    { href: '/contact', label: translations.nav.contact },
  ];

  const services = [
    { href: '/services#custom', label: 'কাস্টম অ্যাপ ডেভেলপমেন্ট' },
    { href: '/services#uiux', label: 'UI/UX ডিজাইন' },
    { href: '/services#api', label: 'API ইন্টিগ্রেশন' },
    { href: '/services#testing', label: 'টেস্টিং ও QA' },
    { href: '/services#maintenance', label: 'রক্ষণাবেক্ষণ' },
    { href: '/services#playstore', label: 'প্লে স্টোর ডিপ্লয়মেন্ট' },
  ];

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Github, href: 'https://github.com', label: 'GitHub' },
    { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
  ];

  return (
    <footer className='bg-gradient-to-b from-gray-900 to-black text-white'>
      {/* Main Footer Content */}
      <div className='container mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
          {/* Company Info */}
          <div className='space-y-4'>
            <div className='flex items-center space-x-2'>
              <div className='bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg'>
                <Smartphone className='h-6 w-6 text-white' />
              </div>
              <div>
                <h3 className='text-xl font-bold'>{translations.company.shortName}</h3>
                <p className='text-xs text-gray-400'>অ্যান্ড্রয়েড সলিউশনস</p>
              </div>
            </div>
            <p className='text-sm text-gray-300 leading-relaxed'>
              {translations.company.tagline}
            </p>
            <div className='space-y-2'>
              <div className='flex items-center space-x-3 text-sm'>
                <MapPin className='h-4 w-4 text-green-500' />
                <span className='text-gray-300'>ঢাকা, বাংলাদেশ</span>
              </div>
              <div className='flex items-center space-x-3 text-sm'>
                <Phone className='h-4 w-4 text-green-500' />
                <span className='text-gray-300'>+৮৮০ ১৭XX-XXXXXX</span>
              </div>
              <div className='flex items-center space-x-3 text-sm'>
                <Mail className='h-4 w-4 text-green-500' />
                <span className='text-gray-300'>info@ira-android.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className='text-lg font-semibold mb-4 text-green-400'>
              {translations.footer.quickLinks}
            </h4>
            <ul className='space-y-2'>
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className='text-sm text-gray-300 hover:text-green-400 transition-colors'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className='text-lg font-semibold mb-4 text-green-400'>
              {translations.footer.services}
            </h4>
            <ul className='space-y-2'>
              {services.map((service) => (
                <li key={service.href}>
                  <Link
                    href={service.href}
                    className='text-sm text-gray-300 hover:text-green-400 transition-colors'
                  >
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className='text-lg font-semibold mb-4 text-green-400'>
              {translations.footer.newsletter.title}
            </h4>
            <p className='text-sm text-gray-300 mb-4'>
              {translations.footer.newsletter.description}
            </p>
            <form className='space-y-3' onSubmit={(e) => e.preventDefault()}>
              <div className='relative'>
                <Input
                  type='email'
                  placeholder={translations.footer.newsletter.placeholder}
                  className='bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 pr-12'
                />
                <Button
                  type='submit'
                  size='sm'
                  className='absolute right-1 top-1 bg-green-600 hover:bg-green-700'
                >
                  <Send className='h-4 w-4' />
                </Button>
              </div>
            </form>

            {/* Social Links */}
            <div className='mt-6'>
              <h5 className='text-sm font-semibold mb-3 text-gray-400'>
                {translations.footer.social}
              </h5>
              <div className='flex space-x-3'>
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='p-2 bg-gray-800 rounded-lg hover:bg-green-600 transition-colors group'
                      aria-label={social.label}
                    >
                      <Icon className='h-4 w-4 text-gray-400 group-hover:text-white' />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className='border-t border-gray-800'>
        <div className='container mx-auto px-4 py-6'>
          <div className='flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0'>
            <p className='text-sm text-gray-400 text-center md:text-left'>
              © {currentYear} {translations.company.name}। সর্বস্বত্ব সংরক্ষিত।
            </p>
            <div className='flex space-x-6 text-sm'>
              <Link href='/privacy' className='text-gray-400 hover:text-green-400 transition-colors'>
                গোপনীয়তা নীতি
              </Link>
              <Link href='/terms' className='text-gray-400 hover:text-green-400 transition-colors'>
                শর্তাবলী
              </Link>
              <Link href='/sitemap' className='text-gray-400 hover:text-green-400 transition-colors'>
                সাইটম্যাপ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}