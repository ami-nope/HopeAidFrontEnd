'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { useAuditLogs } from '@/hooks/useData';
import { ChevronLeft, ChevronRight, RefreshCw, Filter } from 'lucide-react';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');
  const { logs, meta, loading, refetch } = useAuditLogs(page, 20, entityFilter || undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-300">Immutable audit trail ({meta?.total_items ?? 0} entries).</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400 dark:text-gray-400" />
            <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-[#0a0a0a] dark:border-gray-700 dark:text-gray-100">
              <option value="">All Entities</option>
              {['case', 'volunteer', 'household', 'inventory_item', 'user'].map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <Button variant="ghost" size="sm" onClick={refetch} className="gap-2 text-gray-500 dark:text-gray-300"><RefreshCw size={15} /> Refresh</Button>
        </div>
      </div>
      <Card>
        <Table headers={['Action', 'Entity', 'Entity ID', 'Changes', 'Timestamp']}>
          {loading ? Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><div className="h-4 w-20 bg-gray-200 rounded animate-pulse dark:bg-gray-800" /></TableCell>)}</TableRow>
          )) : logs.length === 0 ? (
            <TableRow><TableCell className="text-center text-gray-400 py-8 dark:text-gray-500">No audit logs.</TableCell></TableRow>
          ) : logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium text-sm dark:text-gray-300">{log.action}</TableCell>
              <TableCell className="capitalize text-xs dark:text-gray-300">{log.entity_type}</TableCell>
              <TableCell className="font-mono text-xs text-gray-500 dark:text-gray-400">{log.entity_id?.slice(0, 8)}…</TableCell>
              <TableCell className="text-xs text-gray-600 max-w-[200px] truncate dark:text-gray-300">{log.after_json ? JSON.stringify(log.after_json).slice(0, 50) : '—'}</TableCell>
              <TableCell className="text-xs text-gray-500 whitespace-nowrap dark:text-gray-400">{new Date(log.created_at).toLocaleString()}</TableCell>
            </TableRow>
          ))}
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
