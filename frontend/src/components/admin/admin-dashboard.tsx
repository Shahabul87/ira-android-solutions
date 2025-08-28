'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Shield, 
  Key, 
  Activity, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Server,
  Database,
  Wifi
} from 'lucide-react';
import { AdminDashboardStats, AuditLogStats } from '@/types/admin.types';
import AdminAPI from '@/lib/admin-api';
import { useAuth } from '@/contexts/auth-context';
import { formatDate } from '@/lib/utils';

interface AdminDashboardProps {
  className?: string;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

function StatsCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  variant = 'default' 
}: StatsCardProps): JSX.Element {
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    destructive: 'border-red-200 bg-red-50',
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp 
              className={`h-3 w-3 mr-1 ${
                trend.isPositive ? 'text-green-500' : 'text-red-500 rotate-180'
              }`}
            />
            <span 
              className={`text-xs ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.value}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SystemHealthCardProps {
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    database: {
      status: 'connected' | 'disconnected';
      response_time: number;
    };
    redis: {
      status: 'connected' | 'disconnected';
      response_time: number;
    };
    services: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      response_time?: number;
      error?: string;
    }>;
  };
}

function SystemHealthCard({ health }: SystemHealthCardProps): JSX.Element {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
      case 'disconnected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          System Health
        </CardTitle>
        <CardDescription>
          Real-time system status and performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Overall Status</span>
          <Badge className={getStatusColor(health.status)}>
            {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
          </Badge>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Uptime</p>
            <p className="text-lg font-semibold">{formatUptime(health.uptime)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Version</p>
            <p className="text-lg font-semibold">{health.version}</p>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="text-sm">Database</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(health.database.status)}>
                {health.database.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {health.database.response_time}ms
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              <span className="text-sm">Redis</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(health.redis.status)}>
                {health.redis.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {health.redis.response_time}ms
              </span>
            </div>
          </div>
          
          {health.services.map((service, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted" />
                <span className="text-sm">{service.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(service.status)}>
                  {service.status}
                </Badge>
                {service.response_time && (
                  <span className="text-xs text-muted-foreground">
                    {service.response_time}ms
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ActivityFeedProps {
  auditStats: AuditLogStats;
}

function ActivityFeed({ auditStats }: ActivityFeedProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          System activity overview and top actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{auditStats.logsToday}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{auditStats.logsThisWeek}</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{auditStats.logsThisMonth}</p>
            <p className="text-xs text-muted-foreground">This Month</p>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h4 className="text-sm font-medium mb-2">Top Actions</h4>
          <div className="space-y-2">
            {auditStats.topActions.slice(0, 5).map((action, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{action.action}</span>
                <Badge variant="secondary">{action.count}</Badge>
              </div>
            ))}
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h4 className="text-sm font-medium mb-2">Most Active Users</h4>
          <div className="space-y-2">
            {auditStats.topUsers.slice(0, 5).map((user, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{user.user_name}</span>
                <Badge variant="outline">{user.count}</Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard({ className }: AdminDashboardProps): JSX.Element {
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthCardProps['health'] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);

  // Check permissions on mount
  useEffect(() => {
    setHasAccess(hasPermission('dashboard:read'));
  }, [hasPermission]);

  useEffect(() => {
    if (!hasAccess) return;
    const loadDashboardData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        // Load dashboard stats and system health in parallel
        const [statsResponse, healthResponse] = await Promise.all([
          AdminAPI.getDashboardStats(),
          AdminAPI.getSystemHealth(),
        ]);

        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        } else {
          throw new Error(statsResponse.error?.message || 'Failed to load dashboard stats');
        }

        if (healthResponse.success && healthResponse.data) {
          setSystemHealth(healthResponse.data);
        } else {
          // System health is optional - don't throw error
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [hasAccess]);

  // Return access denied if user doesn't have permission
  if (!hasAccess) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don&apos;t have permission to view the admin dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-40 animate-pulse bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No dashboard data available.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of system status and key metrics
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.users.totalUsers}
          description={`${stats.users.newUsersToday} new today`}
          icon={<Users className="h-4 w-4" />}
          trend={{
            value: Math.round((stats.users.newUsersThisMonth / stats.users.totalUsers) * 100),
            isPositive: stats.users.newUsersThisMonth > 0,
          }}
        />
        
        <StatsCard
          title="Active Users"
          value={stats.users.activeUsers}
          description={`${Math.round((stats.users.activeUsers / stats.users.totalUsers) * 100)}% of total`}
          icon={<Users className="h-4 w-4" />}
          variant={stats.users.activeUsers > stats.users.inactiveUsers ? 'success' : 'warning'}
        />
        
        <StatsCard
          title="Total Roles"
          value={stats.roles.totalRoles}
          description={`${stats.roles.activeRoles} active roles`}
          icon={<Shield className="h-4 w-4" />}
        />
        
        <StatsCard
          title="Permissions"
          value={stats.permissions.totalPermissions}
          description={`${stats.permissions.uniqueResources} resources`}
          icon={<Key className="h-4 w-4" />}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Verified Users"
          value={stats.users.verifiedUsers}
          description={`${Math.round((stats.users.verifiedUsers / stats.users.totalUsers) * 100)}% verified`}
          icon={<Shield className="h-4 w-4" />}
          variant={stats.users.verifiedUsers > stats.users.unverifiedUsers ? 'success' : 'warning'}
        />
        
        <StatsCard
          title="Super Users"
          value={stats.users.superusers}
          description="Administrative accounts"
          icon={<Key className="h-4 w-4" />}
          variant={stats.users.superusers > 0 ? 'default' : 'warning'}
        />
        
        <StatsCard
          title="Audit Logs"
          value={stats.audit.totalLogs}
          description={`${stats.audit.logsToday} today`}
          icon={<Activity className="h-4 w-4" />}
        />
        
        <StatsCard
          title="System Uptime"
          value={`${Math.floor(stats.system.uptime / 86400)}d`}
          description={`Version ${stats.system.version}`}
          icon={<Clock className="h-4 w-4" />}
          variant="success"
        />
      </div>

      {/* Detailed Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {systemHealth && <SystemHealthCard health={systemHealth} />}
        <ActivityFeed auditStats={stats.audit} />
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            Current system status and environment details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Environment</p>
              <p className="text-lg font-semibold">{stats.system.environment}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="text-lg font-semibold">{stats.system.version}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-lg font-semibold">{formatDate(new Date(), 'short')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}