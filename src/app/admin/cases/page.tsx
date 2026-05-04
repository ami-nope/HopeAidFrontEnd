'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Table, TableRow, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCases, CaseItem } from '@/hooks/useData';
import { useAuth } from '@/context/AuthContext';
import { getPortalBasePath } from '@/lib/rbac';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
  MapPin,
  Users as UsersIcon,
  Inbox,
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

const STATUS_OPTIONS = ['', 'new', 'verified', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'];

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusVariant(s: string): 'danger' | 'success' | 'warning' | 'info' | 'default' {
  return { new: 'info', verified: 'info', assigned: 'success', in_progress: 'success', resolved: 'default', closed: 'default', rejected: 'danger' }[s] as 'danger' | 'success' | 'warning' | 'info' | 'default' || 'default';
}

function urgencyVariant(u: string): 'danger' | 'warning' | 'info' | 'default' {
  return { critical: 'danger', high: 'danger', medium: 'warning', low: 'info' }[u] as 'danger' | 'warning' | 'info' | 'default' || 'default';
}

export default function CasesPage() {
  const { user } = useAuth();
  const basePath = getPortalBasePath(user?.role);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const searchParams = useSearchParams();
  const query = searchParams.get('q')?.trim() || undefined;
  const { cases, meta, loading, refetch } = useCases(page, 15, statusFilter || undefined, query);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setPage(1), 0);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cases</h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-300">
            {query
              ? `Showing matches for "${query}" (${meta?.total_items ?? 0} results).`
              : `All aid cases in your organization (${meta?.total_items ?? 0} total).`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {query && (
            <Link
              href={`${basePath}/cases`}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Clear Search
            </Link>
          )}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400 dark:text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:bg-[#0a0a0a] dark:border-gray-700 dark:text-gray-100"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.filter(Boolean).map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <Button variant="ghost" size="sm" onClick={refetch} className="gap-2 text-gray-500 dark:text-gray-300">
            <RefreshCw size={15} /> Refresh
          </Button>
        </div>
      </div>

      <Card>
        <Table headers={['Case #', 'Title', 'Category', 'Status', 'Urgency', 'Location', 'People', 'Risk', 'Created']}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 9 }).map((_, j) => (
                  <TableCell key={j}><div className="h-4 w-16 bg-gray-200 rounded animate-pulse dark:bg-gray-800" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : cases.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="p-0 border-0">
                <EmptyState 
                  icon={Inbox} 
                  title="No cases found" 
                  description="There are no cases matching your current criteria or none have been assigned yet." 
                  className="border-0 bg-transparent py-14" 
                />
              </TableCell>
            </TableRow>
          ) : (
            cases.map((c: CaseItem) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs font-medium text-gray-900 dark:text-gray-100">{c.case_number}</TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900 max-w-[200px] truncate dark:text-gray-100">{c.title}</div>
                  {c.description && <div className="text-xs text-gray-400 truncate max-w-[200px] dark:text-gray-500">{c.description}</div>}
                </TableCell>
                <TableCell className="capitalize text-xs dark:text-gray-300">{c.category}</TableCell>
                <TableCell><Badge variant={statusVariant(c.status)}>{c.status.replace(/_/g, ' ')}</Badge></TableCell>
                <TableCell><Badge variant={urgencyVariant(c.urgency_level)}>{c.urgency_level}</Badge></TableCell>
                <TableCell>
                  {c.location_name ? (
                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300"><MapPin size={12} />{c.location_name}</div>
                  ) : <span className="text-gray-300 text-xs dark:text-gray-700">—</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-xs dark:text-gray-300"><UsersIcon size={12} className="text-gray-400 dark:text-gray-500" />{c.number_of_people_affected}</div>
                </TableCell>
                <TableCell className="text-xs font-medium dark:text-gray-300">
                  {c.risk_score != null ? <span className={c.risk_score > 70 ? 'text-red-600 dark:text-red-400' : c.risk_score > 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}>{c.risk_score.toFixed(1)}</span> : <span className="text-gray-300 dark:text-gray-700">—</span>}
                </TableCell>
                <TableCell className="text-xs text-gray-500 whitespace-nowrap dark:text-gray-400">{formatDate(c.created_at)}</TableCell>
              </TableRow>
            ))
          )}
        </Table>
      </Card>

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {meta.page} of {meta.total_pages} · {meta.total_items} cases
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= meta.total_pages} onClick={() => setPage(page + 1)}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
