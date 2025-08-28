'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Key, 
  Activity, 
  Settings, 
  Menu,
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  permission: string;
  badge?: string;
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: <LayoutDashboard className="h-5 w-5" />,
    permission: 'dashboard:read',
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: <Users className="h-5 w-5" />,
    permission: 'users:read',
  },
  {
    name: 'Roles',
    href: '/admin/roles',
    icon: <Shield className="h-5 w-5" />,
    permission: 'roles:read',
  },
  {
    name: 'Permissions',
    href: '/admin/permissions',
    icon: <Key className="h-5 w-5" />,
    permission: 'permissions:read',
  },
  {
    name: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: <Activity className="h-5 w-5" />,
    permission: 'audit_logs:read',
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: <Settings className="h-5 w-5" />,
    permission: 'system_settings:read',
  },
];

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
}

function Sidebar({ className, onItemClick }: SidebarProps): JSX.Element {
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  // Filter navigation items based on user permissions
  const filteredNavigation = navigation.filter(item => hasPermission(item.permission));

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold">Admin Panel</span>
            <span className="text-xs text-muted-foreground">Enterprise Auth</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              {...(onItemClick && { onClick: onItemClick })}
              className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive 
                  ? 'bg-accent text-accent-foreground' 
                  : 'text-muted-foreground'
              )}
            >
              <div className="flex items-center space-x-2">
                {item.icon}
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center space-x-2 rounded-lg bg-muted p-2">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <span className="text-xs text-muted-foreground">System Healthy</span>
        </div>
      </div>
    </div>
  );
}

interface HeaderProps {
  onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps): JSX.Element {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = (): void => {
    logout();
  };

  const handleProfile = (): void => {
    router.push('/profile');
  };

  const getUserInitials = (): string => {
    if (!user) return 'U';
    const firstInitial = user.first_name?.charAt(0) || '';
    const lastInitial = user.last_name?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase() || user.email.charAt(0).toUpperCase();
  };

  const getUserDisplayName = (): string => {
    if (!user) return 'User';
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email;
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>

        <div className="hidden md:block">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url} alt={getUserDisplayName()} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <div className="flex items-center space-x-1 pt-1">
                  {user?.is_superuser && (
                    <Badge variant="destructive" className="text-xs">
                      Super Admin
                    </Badge>
                  )}
                  {user?.is_verified && (
                    <Badge variant="secondary" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfile}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const handleMenuClick = (): void => {
    setSidebarOpen(true);
  };

  const handleSidebarItemClick = (): void => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex min-h-0 flex-1 flex-col border-r bg-card">
          <Sidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar onItemClick={handleSidebarItemClick} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-64">
        <Header onMenuClick={handleMenuClick} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}