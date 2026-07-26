import React, { useState } from 'react';
import { useGetAuditLog } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Search, Shield, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data: logs, isLoading } = useGetAuditLog({ limit: 100 });

  const users = React.useMemo(() => {
    if (!logs) return [];
    const seen = new Map<string, string>();
    logs.forEach((log) => seen.set(log.userId, log.userName));
    return Array.from(seen.entries()).map(([userId, userName]) => ({ userId, userName }));
  }, [logs]);

  const roles = React.useMemo(() => {
    if (!logs) return [];
    return Array.from(new Set(logs.map((log) => log.role).filter(Boolean))) as string[];
  }, [logs]);

  const filteredLogs = React.useMemo(() => {
    if (!logs) return [];
    let result = logs;

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(log =>
        log.userName.toLowerCase().includes(lower) ||
        log.query.toLowerCase().includes(lower) ||
        log.userId.toLowerCase().includes(lower)
      );
    }
    if (userFilter !== 'all') {
      result = result.filter((log) => log.userId === userFilter);
    }
    if (roleFilter !== 'all') {
      result = result.filter((log) => log.role === roleFilter);
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      result = result.filter((log) => new Date(log.timestamp).getTime() >= from);
    }
    if (dateTo) {
      // Include the entire "to" day
      const to = new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1;
      result = result.filter((log) => new Date(log.timestamp).getTime() <= to);
    }
    return result;
  }, [logs, search, userFilter, roleFilter, dateFrom, dateTo]);

  const activeFilterCount = [userFilter !== 'all', roleFilter !== 'all', !!dateFrom, !!dateTo].filter(Boolean).length;

  const clearFilters = () => {
    setUserFilter('all');
    setRoleFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-foreground uppercase flex items-center gap-2">
            <FileText className="w-6 h-6 text-secondary" />
            System Audit Logs
          </h2>
          <p className="text-muted-foreground text-sm">Immutable record of system queries and data access.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search logs..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/50"
          />
        </div>
      </div>

      {/* Filters Panel */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filter Records</h3>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="h-6 ml-auto text-xs text-muted-foreground hover:text-destructive" onClick={clearFilters}>
                <X className="w-3 h-3 mr-1" />
                Clear ({activeFilterCount})
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-muted-foreground">Officer / User</Label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="bg-background/50 border-border/50 h-9 text-xs">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.userId} value={u.userId}>{u.userName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-muted-foreground">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="bg-background/50 border-border/50 h-9 text-xs">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-muted-foreground">From Date</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-background/50 border-border/50 h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-muted-foreground">To Date</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-background/50 border-border/50 h-9 text-xs" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground -mt-1">
        Showing {filteredLogs.length} of {logs?.length ?? 0} records
      </div>

      <Card className="flex-1 border-border/50 bg-card/50 overflow-hidden flex flex-col">
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-[180px] uppercase text-[10px] tracking-wider font-semibold text-muted-foreground">Timestamp</TableHead>
                <TableHead className="w-[200px] uppercase text-[10px] tracking-wider font-semibold text-muted-foreground">Officer / ID</TableHead>
                <TableHead className="uppercase text-[10px] tracking-wider font-semibold text-muted-foreground">Query / Action</TableHead>
                <TableHead className="w-[120px] text-right uppercase text-[10px] tracking-wider font-semibold text-muted-foreground">Results</TableHead>
                <TableHead className="w-[140px] uppercase text-[10px] tracking-wider font-semibold text-muted-foreground">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No audit records found matching current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="border-border/50 hover:bg-muted/30">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">{log.userName}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{log.userId} [{log.role}]</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-foreground/80 max-w-[400px] truncate" title={log.query}>
                      {log.query}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {log.resultsCount}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.ipAddress || '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
