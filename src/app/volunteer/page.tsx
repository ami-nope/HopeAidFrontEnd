'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  Clock,
  FolderKanban,
  MapPin,
  RefreshCw,
  Shield,
  User,
  Inbox,
} from 'lucide-react';

import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableCell, TableRow } from '@/components/ui/Table';
import { AlertIntelligencePanel } from '@/components/AlertIntelligencePanel';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { CaseItem, useAlerts, useCases } from '@/hooks/useData';
import { getPreferredContact } from '@/lib/contact';

function statusVariant(s: string): 'danger' | 'success' | 'warning' | 'info' | 'default' {
  return (
    {
      new: 'info',
      verified: 'info',
      assigned: 'success',
      in_progress: 'success',
      resolved: 'default',
      closed: 'default',
      rejected: 'danger',
    } as Record<string, 'danger' | 'success' | 'warning' | 'info' | 'default'>
  )[s] || 'default';
}

function urgencyVariant(u: string): 'danger' | 'warning' | 'info' | 'default' {
  return (
    {
      critical: 'danger',
      high: 'danger',
      medium: 'warning',
      low: 'info',
    } as Record<string, 'danger' | 'warning' | 'info' | 'default'>
  )[u] || 'default';
}

function timeAgo(d: string) {
  const ms = Date.now() - new Date(d).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function VolunteerDashboard() {
  const { user, orgName } = useAuth();
  const { cases, meta: casesMeta, loading: casesLoading, refetch: refetchCases } = useCases(1, 10);
  const { alerts, meta: alertsMeta, loading: alertsLoading, refetch: refetchAlerts } = useAlerts(1, 5);
  const contactLabel = getPreferredContact(user);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  const handleRefresh = () => {
    refetchCases();
    refetchAlerts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">
            Welcome, {user?.full_name?.split(' ')[0] || 'Volunteer'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-gray-300">
            {orgName || 'HopeAid'} - Volunteer Dashboard
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh} className="gap-2 text-slate-500 dark:text-gray-300">
          <RefreshCw size={15} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="p-5 lg:col-span-1">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-blue-200 bg-blue-100 text-blue-600 dark:border-blue-900 dark:bg-blue-900/30 dark:text-blue-400">
              <User size={28} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-gray-100">{user?.full_name || 'Volunteer'}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">{contactLabel || '-'}</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 dark:border-blue-900 dark:bg-blue-900/30">
              <Shield size={12} className="text-blue-600 dark:text-blue-400" />
              <span className="text-[11px] font-semibold capitalize text-blue-700 dark:text-blue-300">
                {user?.role?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </Card>

        <StatCard title="Cases in Org" value={String(casesMeta?.total_items ?? 0)} icon={<FolderKanban size={20} />} />
        <StatCard
          title="Active Alerts"
          value={String(alertsMeta?.total_items ?? 0)}
          icon={<AlertTriangle size={20} className="text-red-500" />}
        />
        <StatCard title="Organization" value={orgName || '-'} icon={<MapPin size={20} />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cases</CardTitle>
          <span className="text-xs text-slate-500 dark:text-gray-400">{casesMeta?.total_items ?? 0} total</span>
        </CardHeader>
        {casesLoading ? (
          <div className="p-8 text-center">
            <Clock className="mx-auto animate-spin text-blue-600" size={24} />
          </div>
        ) : cases.length === 0 ? (
          <EmptyState 
            icon={Inbox} 
            title="No cases yet" 
            description="You don't have any cases assigned to you." 
            className="border-0 bg-transparent py-12" 
          />
        ) : (
          <Table headers={['Case #', 'Title', 'Category', 'Status', 'Urgency', 'Location', 'People', 'Created']}>
            {cases.map((c: CaseItem) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs font-medium">{c.case_number}</TableCell>
                <TableCell>
                  <div className="max-w-[180px] truncate font-medium text-slate-900 dark:text-gray-100">
                    {c.title}
                  </div>
                </TableCell>
                <TableCell className="text-xs capitalize">{c.category}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(c.status)}>{c.status.replace(/_/g, ' ')}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={urgencyVariant(c.urgency_level)}>{c.urgency_level}</Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-600 dark:text-gray-300">{c.location_name || '-'}</TableCell>
                <TableCell className="text-xs">{c.number_of_people_affected}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-slate-500 dark:text-gray-400">
                  {timeAgo(c.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </Card>

      {!alertsLoading && alerts.length > 0 && (
        <Card id="alerts">
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((a) => (
              <div key={a.id} className="space-y-3">
                <button
                  type="button"
                  onClick={() => setExpandedAlertId((current) => current === a.id ? null : a.id)}
                  className="flex w-full items-start gap-3 rounded-lg border border-slate-200/80 p-3 text-left transition-colors hover:bg-slate-50/80 dark:border-gray-800 dark:hover:bg-gray-800/50"
                >
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-gray-100">{a.title}</p>
                      <ChevronDown
                        size={15}
                        className={`shrink-0 text-slate-400 transition-transform ${expandedAlertId === a.id ? 'rotate-180' : ''}`}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">{a.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-gray-500">{timeAgo(a.created_at)}</p>
                  </div>
                </button>
                {expandedAlertId === a.id && <AlertIntelligencePanel alert={a} />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
