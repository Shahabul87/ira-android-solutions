'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Calendar,
  User,
  Activity,
  FileText,
  Eye,
  Clock,
  Shield,
  Database,
  Settings,
} from 'lucide-react';
import { AuditLog } from '@/types';
import { AuditLogFilters } from '@/types/admin.types';
import AdminAPI from '@/lib/admin-api';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useDebounce } from '@/hooks/use-debounce';

interface AuditLogViewerProps {
  className?: string;
}

interface AuditLogDetailsDialogProps {
  log: AuditLog | null;
  open: boolean;
  onClose: () => void;
}

function AuditLogDetailsDialog({ log, open, onClose }: AuditLogDetailsDialogProps): JSX.Element | null {
  if (!log) return null;

  const getActionIcon = (action: string): JSX.Element => {
    if (action.includes('create')) return <Database className="h-4 w-4" />;
    if (action.includes('update') || action.includes('edit')) return <Settings className="h-4 w-4" />;
    if (action.includes('delete')) return <AlertCircle className="h-4 w-4" />;
    if (action.includes('login') || action.includes('auth')) return <Shield className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionColor = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (action.includes('create')) return 'default';
    if (action.includes('update') || action.includes('edit')) return 'secondary';
    if (action.includes('delete')) return 'destructive';
    if (action.includes('login') || action.includes('auth')) return 'outline';
    return 'default';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getActionIcon(log.action)}
            Audit Log Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about this audit log entry
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Log ID</p>
              <p className="text-sm font-mono">{log.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Timestamp</p>
              <p className="text-sm">{formatDate(log.created_at, 'long')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">User</p>
              <p className="text-sm font-medium">{log.user_id || 'System'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Action</p>
              <Badge variant={getActionColor(log.action)}>
                {log.action}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Resource Type</p>
              <p className="text-sm">{log.resource_type || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Resource ID</p>
              <p className="text-sm font-mono">{log.resource_id || 'N/A'}</p>
            </div>
          </div>

          {log.ip_address && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">IP Address</p>
              <p className="text-sm font-mono">{log.ip_address}</p>
            </div>
          )}

          {log.user_agent && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">User Agent</p>
              <p className="text-sm break-all">{log.user_agent}</p>
            </div>
          )}

          {log.details && Object.keys(log.details).length > 0 && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Additional Details</p>
              <ScrollArea className="h-[200px] w-full rounded-md border p-3">
                <pre className="text-xs">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AuditLogViewer({ className }: AuditLogViewerProps): JSX.Element {
  const { hasPermission } = useAuth();
  
  // State management
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Available actions and resource types
  const actions = [
    'all',
    'user:login',
    'user:logout',
    'user:create',
    'user:update',
    'user:delete',
    'role:create',
    'role:update',
    'role:delete',
    'permission:assign',
    'permission:remove',
    'settings:update',
  ];

  const resourceTypes = [
    'all',
    'user',
    'role',
    'permission',
    'session',
    'settings',
  ];

  // Load audit logs
  const loadLogs = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const filters: AuditLogFilters = {};
      if (debouncedSearchTerm) filters.search = debouncedSearchTerm;
      if (actionFilter !== 'all') filters.action = actionFilter;
      if (resourceTypeFilter !== 'all') filters.resource_type = resourceTypeFilter;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const response = await AdminAPI.getAuditLogs(filters, currentPage, pageSize);

      if (response.success && response.data) {
        setLogs(response.data.items);
        setTotalPages(response.data.pages);
        setTotalLogs(response.data.total);
      } else {
        throw new Error(response.error?.message || 'Failed to load audit logs');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, actionFilter, resourceTypeFilter, dateFrom, dateTo, currentPage, pageSize]);

  // Load logs on mount and when filters change
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Handle export
  const handleExport = async (format: 'csv' | 'json'): Promise<void> => {
    try {
      const filters: AuditLogFilters = {};
      if (debouncedSearchTerm) filters.search = debouncedSearchTerm;
      if (actionFilter !== 'all') filters.action = actionFilter;
      if (resourceTypeFilter !== 'all') filters.resource_type = resourceTypeFilter;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const response = await AdminAPI.exportAuditLogs(filters, format);

      if (response.success && response.data) {
        window.open(response.data.download_url, '_blank');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export audit logs';
      setError(errorMessage);
    }
  };

  // Get action badge variant
  const getActionVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (action.includes('create')) return 'default';
    if (action.includes('update') || action.includes('edit')) return 'secondary';
    if (action.includes('delete')) return 'destructive';
    if (action.includes('login') || action.includes('logout')) return 'outline';
    return 'default';
  };

  // Get action icon
  const getActionIcon = (action: string): JSX.Element => {
    if (action.includes('create')) return <Database className="h-3 w-3" />;
    if (action.includes('update') || action.includes('edit')) return <Settings className="h-3 w-3" />;
    if (action.includes('delete')) return <AlertCircle className="h-3 w-3" />;
    if (action.includes('login') || action.includes('auth')) return <Shield className="h-3 w-3" />;
    return <Activity className="h-3 w-3" />;
  };

  // Render log row
  const renderLogRow = (log: AuditLog): JSX.Element => {
    return (
      <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLog(log)}>
        <TableCell>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{formatDate(log.created_at, 'relative')}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-mono">
              {log.user_id ? `${log.user_id.slice(0, 8)}...` : 'System'}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={getActionVariant(log.action)} className="gap-1">
            {getActionIcon(log.action)}
            {log.action}
          </Badge>
        </TableCell>
        <TableCell>
          <span className="text-sm">{log.resource_type || '-'}</span>
        </TableCell>
        <TableCell>
          <span className="text-sm font-mono">{log.resource_id ? `${log.resource_id.slice(0, 8)}...` : '-'}</span>
        </TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground">{log.ip_address || '-'}</span>
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedLog(log);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  if (!hasPermission('audit_logs:read')) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don&apos;t have permission to view audit logs.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                System activity and user action history
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadLogs()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('json')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[200px]">
                  <Activity className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  {actions.map(action => (
                    <SelectItem key={action} value={action}>
                      {action === 'all' ? 'All Actions' : action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Resource" />
                </SelectTrigger>
                <SelectContent>
                  {resourceTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type === 'all' ? 'All Resources' : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="From date"
                  className="w-[160px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="To date"
                  className="w-[160px]"
                />
              </div>
              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                >
                  Clear dates
                </Button>
              )}
            </div>
          </div>

          {/* Error display */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource Type</TableHead>
                  <TableHead>Resource ID</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No audit logs found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map(renderLogRow)
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, totalLogs)} of {totalLogs} logs
                </span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(parseInt(value, 10));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="25">25 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                    <SelectItem value="100">100 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log details dialog */}
      <AuditLogDetailsDialog 
        log={selectedLog} 
        open={Boolean(selectedLog)} 
        onClose={() => setSelectedLog(null)} 
      />
    </div>
  );
}