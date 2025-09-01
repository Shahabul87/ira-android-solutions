import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Bengali, Inter } from 'next/font/google';
import './globals.css';
import './animations.css';
import { AuthProvider } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { translations } from '@/lib/translations';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-bengali',
});

export const metadata: Metadata = {
  title: `${translations.company.name} - ${translations.company.tagline}`,
  description: 'এন্টারপ্রাইজ লেভেল অ্যান্ড্রয়েড অ্যাপ ডেভেলপমেন্ট কোম্পানি। উচ্চ মানের, স্কেলেবল এবং ইউজার-ফ্রেন্ডলি অ্যান্ড্রয়েড অ্যাপ্লিকেশন তৈরি করি।',
  keywords: ['android app development', 'অ্যান্ড্রয়েড অ্যাপ', 'mobile app', 'kotlin', 'java', 'bangladesh', 'dhaka'],
  authors: [{ name: translations.company.name }],
  creator: translations.company.name,
  publisher: translations.company.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'bn_BD',
    url: 'https://ira-android.com',
    title: translations.company.name,
    description: translations.company.tagline,
    siteName: translations.company.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: translations.company.name,
    description: translations.company.tagline,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang='bn' suppressHydrationWarning>
      <body className={cn(
        inter.variable,
        notoBengali.variable,
        'font-bengali min-h-screen bg-background antialiased'
      )}>
        <AuthProvider>
          <main className='relative flex min-h-screen flex-col'>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}