'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, MapPin, RefreshCw, Users as UsersIcon, Inbox } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table, TableCell, TableRow } from '@/components/ui/Table';
import { EmptyState } from '@/components/EmptyState';
import { CaseItem, useCases, useMyAssignedCases } from '@/hooks/useData';

function statusVariant(status: string): 'danger' | 'success' | 'warning' | 'info' | 'default' {
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
  )[status] || 'default';
}

function urgencyVariant(urgency: string): 'danger' | 'warning' | 'info' | 'default' {
  return (
    {
      critical: 'danger',
      high: 'danger',
      medium: 'warning',
      low: 'info',
    } as Record<string, 'danger' | 'warning' | 'info' | 'default'>
  )[urgency] || 'default';
}

export default function VolunteerCasesPage() {
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const query = searchParams.get('q')?.trim() || undefined;
  const { cases, meta, loading, refetch } = useCases(page, 15, undefined, query);
  const {
    cases: assignedCases,
    meta: assignedMeta,
    loading: assignedLoading,
    refetch: refetchAssigned,
  } = useMyAssignedCases(1, 5);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setPage(1), 0);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Cases</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-gray-300">
            {query
              ? `Showing matches for "${query}" (${meta?.total_items ?? 0} results).`
              : `Organization cases visible to you (${meta?.total_items ?? 0} total).`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {query && (
            <Link
              href="/volunteer/cases"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Clear Search
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={refetch} className="gap-2 text-slate-500 dark:text-gray-300">
            <RefreshCw size={15} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-gray-100">My Assigned Cases</h2>
          <button
            type="button"
            onClick={() => {
              void refetchAssigned();
              void refetch();
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
        {assignedLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-200 dark:bg-gray-800" />
            <div className="h-4 w-52 animate-pulse rounded bg-slate-200 dark:bg-gray-800" />
            <div className="h-4 w-44 animate-pulse rounded bg-slate-200 dark:bg-gray-800" />
          </div>
        ) : assignedCases.length === 0 ? (
          <EmptyState 
            icon={Inbox} 
            title="No assigned cases" 
            description="You don't have any cases assigned to you yet." 
            className="border-0 bg-transparent py-6" 
          />
        ) : (
          <div className="space-y-2">
            {assignedCases.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/40">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-gray-100">{item.title}</p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">{item.case_number}</p>
                </div>
                <Badge variant={statusVariant(item.status)}>{item.status.replace(/_/g, ' ')}</Badge>
              </div>
            ))}
            <p className="pt-1 text-xs text-slate-500 dark:text-gray-400">
              Showing {assignedCases.length} of {assignedMeta.total_items} assigned case(s).
            </p>
          </div>
        )}
      </Card>

      <Card>
        <Table headers={['Case #', 'Title', 'Category', 'Status', 'Urgency', 'Location', 'People']}>
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                {Array.from({ length: 7 }).map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <div className="h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-gray-800" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : cases.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="p-0 border-0">
                <EmptyState 
                  icon={Inbox} 
                  title="No cases found" 
                  description="There are currently no active cases." 
                  className="border-0 bg-transparent py-14" 
                />
              </TableCell>
            </TableRow>
          ) : (
            cases.map((item: CaseItem) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs font-medium text-slate-900 dark:text-gray-100">
                  {item.case_number}
                </TableCell>
                <TableCell>
                  <div className="max-w-[220px] truncate font-medium text-slate-900 dark:text-gray-100">
                    {item.title}
                  </div>
                  {item.description && (
                    <div className="max-w-[220px] truncate text-xs text-slate-400 dark:text-gray-500">
                      {item.description}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-xs capitalize">{item.category}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(item.status)}>{item.status.replace(/_/g, ' ')}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={urgencyVariant(item.urgency_level)}>{item.urgency_level}</Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-600 dark:text-gray-300">
                  {item.location_name ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} />
                      {item.location_name}
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-xs text-slate-600 dark:text-gray-300">
                  <span className="inline-flex items-center gap-1">
                    <UsersIcon size={12} className="text-slate-400 dark:text-gray-500" />
                    {item.number_of_people_affected}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </Table>
      </Card>

      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Page {meta.page} of {meta.total_pages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.total_pages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
