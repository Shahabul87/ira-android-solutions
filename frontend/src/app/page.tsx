'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage(): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
      </div>
    );
  }

  return (
    <div className='flex flex-col min-h-screen'>
      {/* Header */}
      <header className='border-b'>
        <div className='container mx-auto px-4 py-4 flex justify-between items-center'>
          <div>
            <h1 className='text-2xl font-bold text-primary'>
              Enterprise Auth Template
            </h1>
            <p className='text-sm text-muted-foreground'>
              AI-Ready Authentication System
            </p>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => router.push('/auth/login')}>
              Sign In
            </Button>
            <Button onClick={() => router.push('/auth/register')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className='flex-1 flex items-center justify-center py-20'>
        <div className='container mx-auto px-4 text-center'>
          <div className='max-w-4xl mx-auto'>
            <h2 className='text-4xl md:text-6xl font-bold text-foreground mb-6'>
              Enterprise-Grade Authentication
            </h2>
            <p className='text-xl text-muted-foreground mb-8 max-w-2xl mx-auto'>
              A comprehensive authentication template designed for AI projects. 
              Features enterprise-level security, RBAC, and modern tech stack.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button size='lg' onClick={() => router.push('/auth/register')}>
                Start Building
              </Button>
              <Button variant='outline' size='lg' onClick={() => router.push('/auth/login')}>
                Already have an account?
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-20 bg-muted/50'>
        <div className='container mx-auto px-4'>
          <div className='text-center mb-12'>
            <h3 className='text-3xl font-bold text-foreground mb-4'>
              Built for Modern Applications
            </h3>
            <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
              Everything you need to implement secure authentication in your AI projects
            </p>
          </div>
          
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto'>
            <Card>
              <CardHeader>
                <CardTitle>🔐 Enterprise Security</CardTitle>
                <CardDescription>
                  JWT tokens, bcrypt hashing, account lockout protection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  Industry-standard security practices with comprehensive audit logging
                  and session management.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>👥 Role-Based Access Control</CardTitle>
                <CardDescription>
                  Flexible permissions system with wildcard support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  Granular permission control with role inheritance and 
                  dynamic permission checking.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🚀 AI-Ready Stack</CardTitle>
                <CardDescription>
                  FastAPI backend optimized for AI workloads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  Async/await support, high-performance API endpoints, 
                  and seamless integration with ML frameworks.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>⚡ Modern Frontend</CardTitle>
                <CardDescription>
                  Next.js 14 with TypeScript and Tailwind CSS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  Server-side rendering, type safety, and beautiful UI components
                  with shadcn/ui.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🐳 Docker Ready</CardTitle>
                <CardDescription>
                  Complete containerization for all environments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  Production-ready Docker configurations with PostgreSQL 
                  and Redis support.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🔑 OAuth Integration</CardTitle>
                <CardDescription>
                  Google, GitHub, and social login providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  Easy integration with popular OAuth providers and 
                  WebAuthn/passkey support.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t py-8'>
        <div className='container mx-auto px-4 text-center'>
          <p className='text-sm text-muted-foreground'>
            © 2025 Enterprise Auth Template. Built with Next.js and FastAPI.
          </p>
        </div>
      </footer>
    </div>
  );
}