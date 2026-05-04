'use client';

import React, { useId, useState } from 'react';
import {
  Archive,
  BellOff,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';

import { AlertIntelligencePanel } from '@/components/AlertIntelligencePanel';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table, TableCell, TableRow } from '@/components/ui/Table';
import { ENDPOINTS } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { type AlertFeedStatus, type AlertItem, useAlerts } from '@/hooks/useData';
import { apiFetch } from '@/lib/api-client';
import { hasPermission, resolvePermissions } from '@/lib/rbac';

function severityVariant(s: string): 'danger' | 'warning' | 'info' | 'default' {
  return ({ critical: 'danger', high: 'danger', medium: 'warning', low: 'info' } as Record<string, 'danger' | 'warning' | 'info' | 'default'>)[s] || 'default';
}

function alertTypeStyles(type?: string | null) {
  const styles: Record<string, string> = {
    urgent_case: 'border-rose-200/80 text-rose-700 bg-[linear-gradient(135deg,rgba(251,113,133,0.18),rgba(244,114,182,0.12))] dark:border-rose-900/60 dark:text-rose-200 dark:bg-[linear-gradient(135deg,rgba(190,24,93,0.28),rgba(88,28,135,0.18))]',
    unassigned_critical: 'border-rose-200/80 text-rose-700 bg-[linear-gradient(135deg,rgba(251,113,133,0.18),rgba(244,114,182,0.12))] dark:border-rose-900/60 dark:text-rose-200 dark:bg-[linear-gradient(135deg,rgba(190,24,93,0.28),rgba(88,28,135,0.18))]',
    conflict_detected: 'border-amber-200/80 text-amber-700 bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(56,189,248,0.14))] dark:border-amber-900/60 dark:text-amber-200 dark:bg-[linear-gradient(135deg,rgba(180,83,9,0.3),rgba(30,64,175,0.2))]',
    inventory_low: 'border-orange-200/80 text-orange-700 bg-[linear-gradient(135deg,rgba(251,146,60,0.18),rgba(125,211,252,0.12))] dark:border-orange-900/60 dark:text-orange-200 dark:bg-[linear-gradient(135deg,rgba(154,52,18,0.3),rgba(29,78,216,0.2))]',
  };

  return styles[type || ''] || 'border-cyan-200/70 text-cyan-700 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(99,102,241,0.16))] dark:border-cyan-900/60 dark:text-cyan-200 dark:bg-[linear-gradient(135deg,rgba(14,116,144,0.3),rgba(76,29,149,0.22))]';
}

interface ScanResult {
  scanned_cases: number;
  assessed_cases: number;
  alerts_created_or_updated: number;
  alerts_resolved: number;
  geocoded_cases: number;
  skipped_cases: number;
}

function AiLogo({ className = '' }: { className?: string }) {
  const rawId = useId();
  const safeId = rawId.replace(/:/g, '');
  const textId = `ai-text-${safeId}`;
  const sparkleId = `ai-sparkle-${safeId}`;

  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={textId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id={sparkleId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      <g fill={`url(#${sparkleId})`}>
        <polygon points="12,8 14,14 20,16 14,18 12,24 10,18 4,16 10,14" />
        <polygon points="23,6 24.5,9.5 28,11 24.5,12.5 23,16 21.5,12.5 18,11 21.5,9.5" />
        <polygon points="6,24 7.5,27 11,28 7.5,29 6,32 4.5,29 1,28 4.5,27" />
      </g>
      <text
        x="30"
        y="31"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        letterSpacing="0.04em"
        fill={`url(#${textId})`}
        style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
      >
        AI
      </text>
    </svg>
  );
}

export default function AlertsPage() {
  const { user, permissions } = useAuth();
  const effectivePermissions = resolvePermissions(permissions, user?.role);
  const canResolveAlerts = hasPermission(effectivePermissions, 'alerts:resolve');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<AlertFeedStatus>('active');
  const { alerts, meta, loading, refetch } = useAlerts(page, 15, view);
  const [actingAlertId, setActingAlertId] = useState<string | null>(null);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [runningScan, setRunningScan] = useState(false);
  const [actionError, setActionError] = useState('');
  const [scanSummary, setScanSummary] = useState('');

  const performAlertAction = async (alertId: string, action: 'resolve' | 'activate') => {
    setActingAlertId(alertId);
    setActionError('');

    try {
      await apiFetch(`${ENDPOINTS.alerts}/${alertId}/${action}`, { method: 'POST' });
      await refetch();
      if (expandedAlertId === alertId) {
        setExpandedAlertId(null);
      }
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : action === 'resolve'
            ? 'Unable to archive alert'
            : 'Unable to activate alert',
      );
    } finally {
      setActingAlertId(null);
    }
  };

  const runIntelligenceScan = async () => {
    setRunningScan(true);
    setActionError('');

    try {
      const response = await apiFetch<{ success: boolean; data: ScanResult }>(ENDPOINTS.alertsIntelligenceRun, {
        method: 'POST',
      });
      const data = response.data;
      setScanSummary(
        `${data.assessed_cases} assessed, ${data.alerts_created_or_updated} alerts updated, ${data.geocoded_cases} locations resolved.`,
      );
      await refetch();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to run AI scan');
    } finally {
      setRunningScan(false);
    }
  };

  const toggleExpanded = (alert: AlertItem) => {
    setExpandedAlertId((current) => (current === alert.id ? null : alert.id));
  };

  const switchView = (nextView: AlertFeedStatus) => {
    setView(nextView);
    setPage(1);
    setExpandedAlertId(null);
    setActionError('');
    if (nextView !== 'active') {
      setScanSummary('');
    }
  };

  const isHistoryView = view === 'resolved';

  return (
    <div className="space-y-8 font-sans">
      <div className="relative overflow-hidden rounded-[28px] border border-cyan-200/70 bg-[radial-gradient(60%_60%_at_15%_10%,rgba(34,211,238,0.18),transparent_70%),linear-gradient(140deg,rgba(236,252,255,0.98),rgba(255,255,255,0.92))] p-7 shadow-[0_32px_90px_-55px_rgba(6,182,212,0.6)] dark:border-cyan-900/50 dark:bg-[radial-gradient(60%_60%_at_15%_10%,rgba(14,116,144,0.35),transparent_70%),linear-gradient(140deg,rgba(6,10,20,0.98),rgba(12,18,32,0.92))]">
        <div className="absolute inset-0 opacity-40 [mask-image:linear-gradient(180deg,black,transparent)] bg-[linear-gradient(90deg,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(180deg,rgba(148,163,184,0.16)_1px,transparent_1px)] bg-[size:26px_26px]" />
        <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-500/20" />
        <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-blue-300/20 blur-3xl dark:bg-blue-500/20" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-950/30 dark:text-cyan-200">
              <AiLogo className="h-7 w-7 shrink-0" />
              <span className="leading-none">AI ANALYSIS</span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">AI ANALYSIS</h1>
            <p
              className="mt-2 max-w-2xl text-sm leading-6 text-transparent select-none"
              aria-hidden="true"
            >
              AI ANALYSIS
            </p>
            {scanSummary && (
              <p className="mt-4 text-sm font-medium text-cyan-700 dark:text-cyan-200">Scan update: {scanSummary}</p>
            )}
            <div className="mt-5 inline-flex rounded-full border border-cyan-200/80 bg-white/75 p-1 shadow-sm dark:border-cyan-900/50 dark:bg-slate-950/40">
              <button
                type="button"
                onClick={() => switchView('active')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  !isHistoryView
                    ? 'bg-cyan-500 text-white shadow-[0_12px_30px_-18px_rgba(6,182,212,0.85)]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <AiLogo className="h-7 w-7 shrink-0" />
                <span className="leading-none">Live Feed</span>
              </button>
              <button
                type="button"
                onClick={() => switchView('resolved')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  isHistoryView
                    ? 'bg-slate-900 text-white shadow-[0_12px_30px_-18px_rgba(15,23,42,0.9)] dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <Archive size={14} />
                Archive
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              className="gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              <RefreshCw size={15} />
              Sync Feed
            </Button>
            {!isHistoryView && (
              <Button
                onClick={runIntelligenceScan}
                disabled={runningScan}
                className="gap-2 border border-cyan-300/70 bg-cyan-500 text-white shadow-[0_18px_45px_-24px_rgba(6,182,212,0.75)] hover:bg-cyan-400 dark:border-cyan-800 dark:bg-cyan-500/90"
              >
                {runningScan ? <Loader2 size={15} className="animate-spin" /> : <AiLogo className="h-7 w-7 shrink-0" />}
                <span className="leading-none">{runningScan ? 'Analyzing...' : 'Run AI Analysis'}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card>
        {actionError && (
          <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
            {actionError}
          </div>
        )}

        <Table headers={canResolveAlerts ? ['Alert', 'Description', <span key="alert-type" className="block text-center">Alert Type</span>, <span key="risk-type" className="block text-center">Risk Type</span>, 'Time', <span key="action" className="block text-center">Action</span>] : ['Alert', 'Description', <span key="alert-type" className="block text-center">Alert Type</span>, <span key="risk-type" className="block text-center">Risk Type</span>, 'Time']}>
          {loading ? Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: canResolveAlerts ? 6 : 5 }).map((__, j) => (
                <TableCell key={j}>
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                </TableCell>
              ))}
            </TableRow>
          )) : alerts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canResolveAlerts ? 6 : 5} className="border-0 p-0">
                <EmptyState
                  icon={BellOff}
                  title={isHistoryView ? 'No archived alerts' : 'No active alerts'}
                  description={
                    isHistoryView
                      ? 'Resolved AI alerts will appear here for audit and reactivation.'
                      : 'Monitoring looks clear. New AI alerts will surface here automatically.'
                  }
                  className="border-0 bg-transparent py-14"
                />
              </TableCell>
            </TableRow>
          ) : alerts.map((alert) => {
            const isExpanded = expandedAlertId === alert.id;

            return (
              <React.Fragment key={alert.id}>
                <TableRow onClick={() => toggleExpanded(alert)} className="cursor-pointer align-top group hover:bg-cyan-50/80 dark:hover:bg-cyan-950/30">
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center">
                        <AiLogo className="h-full w-full" />
                      </div>
                      <div>
                        <p className="font-medium">{alert.title}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[360px] text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-start justify-between gap-3">
                      <span className={isExpanded ? '' : 'line-clamp-2'}>{alert.message}</span>
                      <ChevronDown
                        size={16}
                        className={`mt-0.5 shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs capitalize dark:text-gray-300">
                    <Badge
                      variant="default"
                      className={`mx-auto min-w-[120px] justify-center border capitalize text-[11px] tracking-[0.16em] ${alertTypeStyles(alert.alert_type)}`}
                    >
                      {alert.alert_type?.replace(/_/g, ' ') ?? '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={severityVariant(alert.severity)} className="mx-auto uppercase tracking-[0.14em]">
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {new Date(isHistoryView ? alert.resolved_at || alert.created_at : alert.created_at).toLocaleString()}
                  </TableCell>
                  {canResolveAlerts && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          void performAlertAction(alert.id, isHistoryView ? 'activate' : 'resolve');
                        }}
                        disabled={actingAlertId === alert.id}
                        className={`gap-1 text-xs ${isHistoryView ? 'text-cyan-600 dark:text-cyan-300' : 'text-emerald-600 dark:text-emerald-400'}`}
                      >
                        {actingAlertId === alert.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : isHistoryView ? (
                          <RotateCcw size={14} />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        {actingAlertId === alert.id ? 'Saving...' : isHistoryView ? 'Reopen' : 'Archive'}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
                {isExpanded && (
                  <TableRow className="bg-transparent hover:bg-transparent">
                    <TableCell colSpan={canResolveAlerts ? 6 : 5} className="px-4 pb-5 pt-0">
                      <AlertIntelligencePanel alert={alert} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </Table>
      </Card>

      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">Page {meta.page} of {meta.total_pages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></Button>
            <Button variant="outline" size="sm" disabled={page >= meta.total_pages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
