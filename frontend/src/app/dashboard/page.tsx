'use client';

import Link from 'next/link';
import { useRequireAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User } from 'lucide-react';

export default function DashboardPage(): JSX.Element {
  const { user, logout, permissions, hasPermission, hasRole } = useRequireAuth();

  if (!user) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-muted/50'>
      {/* Header */}
      <header className='border-b bg-background'>
        <div className='container mx-auto px-4 py-4 flex justify-between items-center'>
          <div>
            <h1 className='text-2xl font-bold text-primary'>Dashboard</h1>
            <p className='text-sm text-muted-foreground'>
              Welcome back, {user.first_name}!
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <Button asChild variant='outline'>
              <Link href='/profile' className='flex items-center gap-2'>
                <User className='h-4 w-4' />
                Profile
              </Link>
            </Button>
            <Button onClick={logout} variant='outline'>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className='container mx-auto px-4 py-8'>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className='space-y-2'>
              <div>
                <span className='text-sm font-medium'>Name:</span>
                <span className='ml-2 text-sm'>{user.first_name} {user.last_name}</span>
              </div>
              <div>
                <span className='text-sm font-medium'>Email:</span>
                <span className='ml-2 text-sm'>{user.email}</span>
              </div>
              <div>
                <span className='text-sm font-medium'>Status:</span>
                <span className={`ml-2 text-sm ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <span className='text-sm font-medium'>Verified:</span>
                <span className={`ml-2 text-sm ${user.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                  {user.is_verified ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className='text-sm font-medium'>Admin:</span>
                <span className={`ml-2 text-sm ${user.is_superuser ? 'text-blue-600' : 'text-gray-600'}`}>
                  {user.is_superuser ? 'Yes' : 'No'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Roles Card */}
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>Your assigned roles</CardDescription>
            </CardHeader>
            <CardContent>
              {user.roles && user.roles.length > 0 ? (
                <div className='space-y-2'>
                  {user.roles.map((role) => (
                    <div
                      key={role.id}
                      className='flex items-center justify-between p-2 bg-muted rounded-md'
                    >
                      <div>
                        <div className='font-medium text-sm'>{role.name}</div>
                        {role.description && (
                          <div className='text-xs text-muted-foreground'>
                            {role.description}
                          </div>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        role.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {role.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-muted-foreground'>No roles assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Permissions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>Your current permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {permissions.length > 0 ? (
                <div className='space-y-1'>
                  {permissions.slice(0, 5).map((permission) => (
                    <div
                      key={permission}
                      className='text-sm p-2 bg-muted rounded-md'
                    >
                      {permission}
                    </div>
                  ))}
                  {permissions.length > 5 && (
                    <p className='text-xs text-muted-foreground mt-2'>
                      +{permissions.length - 5} more permissions
                    </p>
                  )}
                </div>
              ) : (
                <p className='text-sm text-muted-foreground'>No permissions assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Permission Testing Card */}
          <Card className='md:col-span-2 lg:col-span-3'>
            <CardHeader>
              <CardTitle>Permission Testing</CardTitle>
              <CardDescription>Test your permissions and roles</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <h4 className='font-medium text-sm mb-2'>Permission Checks:</h4>
                  <div className='space-y-1'>
                    <div className='text-sm'>
                      <span className='font-medium'>users:read:</span>
                      <span className={`ml-2 ${hasPermission('users:read') ? 'text-green-600' : 'text-red-600'}`}>
                        {hasPermission('users:read') ? '✓ Allowed' : '✗ Denied'}
                      </span>
                    </div>
                    <div className='text-sm'>
                      <span className='font-medium'>users:write:</span>
                      <span className={`ml-2 ${hasPermission('users:write') ? 'text-green-600' : 'text-red-600'}`}>
                        {hasPermission('users:write') ? '✓ Allowed' : '✗ Denied'}
                      </span>
                    </div>
                    <div className='text-sm'>
                      <span className='font-medium'>admin:*:</span>
                      <span className={`ml-2 ${hasPermission('admin:*') ? 'text-green-600' : 'text-red-600'}`}>
                        {hasPermission('admin:*') ? '✓ Allowed' : '✗ Denied'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className='font-medium text-sm mb-2'>Role Checks:</h4>
                  <div className='space-y-1'>
                    <div className='text-sm'>
                      <span className='font-medium'>admin:</span>
                      <span className={`ml-2 ${hasRole('admin') ? 'text-green-600' : 'text-red-600'}`}>
                        {hasRole('admin') ? '✓ Has Role' : '✗ No Role'}
                      </span>
                    </div>
                    <div className='text-sm'>
                      <span className='font-medium'>user:</span>
                      <span className={`ml-2 ${hasRole('user') ? 'text-green-600' : 'text-red-600'}`}>
                        {hasRole('user') ? '✓ Has Role' : '✗ No Role'}
                      </span>
                    </div>
                    <div className='text-sm'>
                      <span className='font-medium'>moderator:</span>
                      <span className={`ml-2 ${hasRole('moderator') ? 'text-green-600' : 'text-red-600'}`}>
                        {hasRole('moderator') ? '✓ Has Role' : '✗ No Role'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <div className='mt-8'>
          <Alert>
            <AlertDescription>
              <strong>System Status:</strong> All systems operational. Your authentication session is active and secure.
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </div>
  );
}