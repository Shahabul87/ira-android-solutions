'use client';

import { useRequireAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { ProfileForm } from '@/components/profile/profile-form';
import { ChangePasswordForm } from '@/components/profile/change-password-form';
import { TwoFactorSettings } from '@/components/auth/two-factor-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { User, Settings, Shield, Clock, CheckCircle, XCircle, Link as LinkIcon, Unlink, Loader2 } from 'lucide-react';
import { Icons } from '@/components/icons';
import AuthAPI from '@/lib/auth-api';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LinkedAccount {
  provider: string;
  provider_user_id: string;
  linked_at: string;
}

export default function ProfilePage(): JSX.Element {
  const { user, logout } = useRequireAuth();
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [oauthMessage, setOauthMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchLinkedAccounts();
    }
  }, [user]);

  const fetchLinkedAccounts = async (): Promise<void> => {
    try {
      const response = await AuthAPI.getLinkedAccounts();
      if (response.success && response.data) {
        setLinkedAccounts(response.data);
      }
    } catch {
      // Silent fail - linked accounts are not critical
    }
  };

  const handleLinkAccount = async (provider: string): Promise<void> => {
    setOauthLoading(provider);
    setOauthMessage(null);

    try {
      const response = await AuthAPI.linkOAuthAccount(provider);
      if (response.success && response.data) {
        window.location.href = response.data.authorize_url;
      } else {
        throw new Error(response.error?.message || 'Failed to link account');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to link account';
      setOauthMessage({ type: 'error', text: errorMessage });
      setOauthLoading(null);
    }
  };

  const handleUnlinkAccount = async (provider: string): Promise<void> => {
    if (!confirm(`Are you sure you want to unlink your ${provider} account?`)) {
      return;
    }

    setOauthLoading(provider);
    setOauthMessage(null);

    try {
      const response = await AuthAPI.unlinkOAuthAccount(provider);
      if (response.success) {
        setOauthMessage({ type: 'success', text: `${provider} account unlinked successfully` });
        await fetchLinkedAccounts();
      } else {
        throw new Error(response.error?.message || 'Failed to unlink account');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unlink account';
      setOauthMessage({ type: 'error', text: errorMessage });
    } finally {
      setOauthLoading(null);
    }
  };

  const getProviderIcon = (provider: string): React.ReactNode => {
    switch (provider.toLowerCase()) {
      case 'google':
        return <Icons.google className="h-5 w-5" />;
      case 'github':
        return <Icons.gitHub className="h-5 w-5" />;
      case 'microsoft':
        return <Icons.microsoft className="h-5 w-5" />;
      default:
        return <LinkIcon className="h-5 w-5" />;
    }
  };

  const isLinked = (provider: string): boolean => {
    return linkedAccounts.some(account => account.provider.toLowerCase() === provider.toLowerCase());
  };

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
            <h1 className='text-2xl font-bold text-primary flex items-center gap-2'>
              <User className='h-6 w-6' />
              Profile Settings
            </h1>
            <p className='text-sm text-muted-foreground'>
              Manage your account settings and preferences
            </p>
          </div>
          <Button onClick={logout} variant='outline'>
            Sign Out
          </Button>
        </div>
      </header>

      <main className='container mx-auto px-4 py-8'>
        <div className='grid gap-6 md:grid-cols-4'>
          {/* User Info Sidebar */}
          <div className='md:col-span-1'>
            <Card>
              <CardHeader className='text-center'>
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-semibold'>
                  {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                </div>
                <CardTitle>{user.first_name} {user.last_name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Account Status */}
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Status</span>
                    <Badge variant={user.is_active ? 'default' : 'destructive'}>
                      {user.is_active ? (
                        <><CheckCircle className='w-3 h-3 mr-1' /> Active</>
                      ) : (
                        <><XCircle className='w-3 h-3 mr-1' /> Inactive</>
                      )}
                    </Badge>
                  </div>
                  
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Email Verified</span>
                    <Badge variant={user.is_verified ? 'default' : 'secondary'}>
                      {user.is_verified ? (
                        <><CheckCircle className='w-3 h-3 mr-1' /> Yes</>
                      ) : (
                        <><XCircle className='w-3 h-3 mr-1' /> No</>
                      )}
                    </Badge>
                  </div>

                  {user.is_superuser && (
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium'>Admin</span>
                      <Badge variant='default'>
                        <Shield className='w-3 h-3 mr-1' /> Yes
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Account Info */}
                <div className='space-y-2 pt-4 border-t'>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <Clock className='h-4 w-4' />
                    <span>Member since {formatDate(user.created_at, 'long')}</span>
                  </div>
                  
                  {user.last_login && (
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <User className='h-4 w-4' />
                      <span>Last login {formatDate(user.last_login, 'relative')}</span>
                    </div>
                  )}
                </div>

                {/* Roles */}
                {user.roles && user.roles.length > 0 && (
                  <div className='space-y-2 pt-4 border-t'>
                    <span className='text-sm font-medium'>Roles</span>
                    <div className='space-y-1'>
                      {user.roles.map((role) => (
                        <Badge key={role.id} variant='outline' className='w-full justify-start'>
                          {role.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className='md:col-span-3'>
            <Tabs defaultValue='profile' className='space-y-6'>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='profile' className='flex items-center gap-2'>
                  <User className='h-4 w-4' />
                  Personal Info
                </TabsTrigger>
                <TabsTrigger value='security' className='flex items-center gap-2'>
                  <Shield className='h-4 w-4' />
                  Security
                </TabsTrigger>
              </TabsList>

              <TabsContent value='profile' className='space-y-6'>
                <ProfileForm />
              </TabsContent>

              <TabsContent value='security' className='space-y-6'>
                <ChangePasswordForm />
                
                {/* OAuth Linked Accounts */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <LinkIcon className='h-5 w-5' />
                      Linked Accounts
                    </CardTitle>
                    <CardDescription>
                      Connect your social accounts for easier sign-in
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {oauthMessage && (
                      <Alert
                        variant={oauthMessage.type === 'error' ? 'destructive' : 'default'}
                        className="mb-4"
                      >
                        <AlertDescription>{oauthMessage.text}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-3">
                      {['google', 'github', 'microsoft'].map((provider) => {
                        const linked = isLinked(provider);
                        const linkedAccount = linkedAccounts.find(
                          acc => acc.provider.toLowerCase() === provider.toLowerCase()
                        );

                        return (
                          <div
                            key={provider}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {getProviderIcon(provider)}
                              <div>
                                <p className="font-medium capitalize">{provider}</p>
                                {linked && linkedAccount && (
                                  <p className="text-sm text-muted-foreground">
                                    Connected on {new Date(linkedAccount.linked_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant={linked ? 'destructive' : 'outline'}
                              size="sm"
                              onClick={() =>
                                linked
                                  ? handleUnlinkAccount(provider)
                                  : handleLinkAccount(provider)
                              }
                              disabled={oauthLoading === provider}
                            >
                              {oauthLoading === provider ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : linked ? (
                                <>
                                  <Unlink className="h-4 w-4 mr-1" />
                                  Disconnect
                                </>
                              ) : (
                                <>
                                  <LinkIcon className="h-4 w-4 mr-1" />
                                  Connect
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Two-Factor Authentication Settings */}
                <TwoFactorSettings />
                
                {/* Additional Security Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Settings className='h-5 w-5' />
                      Additional Security Settings
                    </CardTitle>
                    <CardDescription>
                      More security features and account management options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex items-center justify-between p-4 border rounded-lg'>
                      <div>
                        <h4 className='text-sm font-medium'>Login Sessions</h4>
                        <p className='text-sm text-muted-foreground'>
                          Manage and monitor your active login sessions
                        </p>
                      </div>
                      <Button variant='outline' disabled>
                        Coming Soon
                      </Button>
                    </div>

                    <div className='flex items-center justify-between p-4 border rounded-lg'>
                      <div>
                        <h4 className='text-sm font-medium'>Account Activity</h4>
                        <p className='text-sm text-muted-foreground'>
                          View recent activity and login attempts
                        </p>
                      </div>
                      <Button variant='outline' disabled>
                        Coming Soon
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}