import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Enterprise Auth Template',
  description: 'A comprehensive authentication template for AI projects',
  keywords: ['authentication', 'enterprise', 'AI', 'template', 'Next.js', 'FastAPI'],
  authors: [{ name: 'Enterprise Auth Template' }],
  creator: 'Enterprise Auth Template',
  publisher: 'Enterprise Auth Template',
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
    locale: 'en_US',
    url: 'https://enterprise-auth-template.com',
    title: 'Enterprise Auth Template',
    description: 'A comprehensive authentication template for AI projects',
    siteName: 'Enterprise Auth Template',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Enterprise Auth Template',
    description: 'A comprehensive authentication template for AI projects',
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
    <html lang='en' suppressHydrationWarning>
      <body className={cn(inter.className, 'min-h-screen bg-background antialiased')}>
        <AuthProvider>
          <main className='relative flex min-h-screen flex-col'>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}