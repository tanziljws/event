'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ApiService } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, User, Search, Filter, Download, Eye, AlertTriangle, CheckCircle, XCircle, Users, Activity } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  performedAt: string;
  reason?: string;
  previousStatus?: string;
  newStatus?: string;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: any;
  performer: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

interface AuditStats {
  actionCounts: Record<string, number>;
  entityTypeCounts: Record<string, number>;
  dailyActivity: Array<{
    date: string;
    count: number;
  }>;
}

interface AgentPerformance {
  agent: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  totalActions: number;
  approvals: number;
  declines: number;
  approvalRate: number;
  byEntityType: Record<string, {
    approvals: number;
    declines: number;
    total: number;
  }>;
  logs: AuditLog[];
}

export default function OperationsAuditPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [agentsPerformance, setAgentsPerformance] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filters, setFilters] = useState({
    performedBy: '',
    entityType: '',
    action: '',
    startDate: '',
    endDate: '',
    limit: 50,
    offset: 0
  });

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isInitialized && user && !['OPS_HEAD', 'SUPER_ADMIN'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    if (isAuthenticated) {
      fetchAuditData();
    }
  }, [isAuthenticated, isInitialized, user, router]);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      
      const [logsResponse, statsResponse, performanceResponse] = await Promise.all([
        ApiService.getAuditLogs(filters),
        ApiService.getAuditStats(),
        ApiService.getAgentsPerformance()
      ]);

      if (logsResponse.success) {
        setAuditLogs(logsResponse.data.logs);
      }

      if (statsResponse.success) {
        setAuditStats(statsResponse.data);
      }

      if (performanceResponse.success) {
        setAgentsPerformance(performanceResponse.data);
      }
    } catch (error) {
      console.error('Error fetching audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const applyFilters = () => {
    fetchAuditData();
  };

  const clearFilters = () => {
    setFilters({
      performedBy: '',
      entityType: '',
      action: '',
      startDate: '',
      endDate: '',
      limit: 50,
      offset: 0
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'APPROVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'DECLINE':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'ASSIGN':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'REASSIGN':
        return <Activity className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'APPROVE':
        return 'bg-green-100 text-green-800';
      case 'DECLINE':
        return 'bg-red-100 text-red-800';
      case 'ASSIGN':
        return 'bg-blue-100 text-blue-800';
      case 'REASSIGN':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-gray-600 mt-2">Monitor all agent actions and maintain accountability</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={applyFilters} variant="primary">
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
          <Button onClick={clearFilters} variant="outline">
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
              <Input
                placeholder="Agent name or email"
                value={filters.performedBy}
                onChange={(e) => handleFilterChange('performedBy', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
              <Select value={filters.entityType} onValueChange={(value) => handleFilterChange('entityType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="EVENT">Event</SelectItem>
                  <SelectItem value="ORGANIZER">Organizer</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="APPROVE">Approve</SelectItem>
                  <SelectItem value="DECLINE">Decline</SelectItem>
                  <SelectItem value="ASSIGN">Assign</SelectItem>
                  <SelectItem value="REASSIGN">Reassign</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
              <Select value={filters.limit.toString()} onValueChange={(value) => handleFilterChange('limit', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {auditStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(auditStats.actionCounts).reduce((sum, count) => sum + count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approvals</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {auditStats.actionCounts.APPROVE || 0}
              </div>
              <p className="text-xs text-muted-foreground">Successful approvals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Declines</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {auditStats.actionCounts.DECLINE || 0}
              </div>
              <p className="text-xs text-muted-foreground">Rejected items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignments</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {auditStats.actionCounts.ASSIGN || 0}
              </div>
              <p className="text-xs text-muted-foreground">Items assigned</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agent Performance */}
      {agentsPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance Summary</CardTitle>
            <CardDescription>Performance metrics for all agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agentsPerformance.map((agent) => (
                <div key={agent.agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{agent.agent.fullName}</p>
                      <p className="text-sm text-gray-500">{agent.agent.email}</p>
                      <Badge variant="outline" className="mt-1">
                        {agent.agent.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{agent.approvals}</p>
                        <p className="text-xs text-gray-500">Approvals</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{agent.declines}</p>
                        <p className="text-xs text-gray-500">Declines</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{agent.approvalRate}%</p>
                        <p className="text-xs text-gray-500">Approval Rate</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>Detailed log of all agent actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  {getActionIcon(log.action)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getActionBadgeColor(log.action)}>
                        {log.action}
                      </Badge>
                      <Badge variant="outline">{log.entityType}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>{log.performer.fullName}</strong> {log.action.toLowerCase()}d {log.entityType.toLowerCase()} 
                      {log.reason && ` - ${log.reason}`}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(log.performedAt)}
                      </div>
                      {log.ipAddress && (
                        <div className="flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {log.ipAddress}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedLog(log)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Audit Log Details</DialogTitle>
                      <DialogDescription>
                        Complete information about this action
                      </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="font-medium">Action</label>
                            <p className="text-sm text-gray-600">{selectedLog.action}</p>
                          </div>
                          <div>
                            <label className="font-medium">Entity Type</label>
                            <p className="text-sm text-gray-600">{selectedLog.entityType}</p>
                          </div>
                          <div>
                            <label className="font-medium">Entity ID</label>
                            <p className="text-sm text-gray-600 font-mono">{selectedLog.entityId}</p>
                          </div>
                          <div>
                            <label className="font-medium">Performed By</label>
                            <p className="text-sm text-gray-600">{selectedLog.performer.fullName}</p>
                          </div>
                          <div>
                            <label className="font-medium">Performed At</label>
                            <p className="text-sm text-gray-600">{formatDate(selectedLog.performedAt)}</p>
                          </div>
                          <div>
                            <label className="font-medium">IP Address</label>
                            <p className="text-sm text-gray-600">{selectedLog.ipAddress || 'N/A'}</p>
                          </div>
                        </div>
                        {selectedLog.reason && (
                          <div>
                            <label className="font-medium">Reason</label>
                            <p className="text-sm text-gray-600">{selectedLog.reason}</p>
                          </div>
                        )}
                        {selectedLog.previousStatus && (
                          <div>
                            <label className="font-medium">Previous Status</label>
                            <p className="text-sm text-gray-600">{selectedLog.previousStatus}</p>
                          </div>
                        )}
                        {selectedLog.newStatus && (
                          <div>
                            <label className="font-medium">New Status</label>
                            <p className="text-sm text-gray-600">{selectedLog.newStatus}</p>
                          </div>
                        )}
                        {selectedLog.metadata && (
                          <div>
                            <label className="font-medium">Metadata</label>
                            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                              {JSON.stringify(selectedLog.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
