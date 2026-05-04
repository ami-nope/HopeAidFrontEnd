'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { useHouseholds } from '@/hooks/useData';
import { ChevronLeft, ChevronRight, RefreshCw, MapPin, Users } from 'lucide-react';

export default function HouseholdsPage() {
  const [page, setPage] = useState(1);
  const { households, meta, loading, refetch } = useHouseholds(page, 15);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Households</h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-300">Registered households ({meta?.total_items ?? 0} total).</p>
        </div>
        <Button variant="ghost" size="sm" onClick={refetch} className="gap-2 text-gray-500 dark:text-gray-300"><RefreshCw size={15} /> Refresh</Button>
      </div>

      <Card>
        <Table headers={['Name', 'Location', 'Contact', 'Coordinates', 'People']}>
          {loading ? Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><div className="h-4 w-16 bg-gray-200 rounded animate-pulse dark:bg-gray-800" /></TableCell>)}</TableRow>
          )) : households.length === 0 ? (
            <TableRow><TableCell className="text-center text-gray-400 py-8 dark:text-gray-400">No households registered.</TableCell></TableRow>
          ) : households.map((h) => (
            <TableRow key={h.id}>
              <TableCell className="font-medium text-gray-900 dark:text-gray-100">{h.household_name}</TableCell>
              <TableCell>{h.location_name ? <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300"><MapPin size={12} />{h.location_name}</div> : <span className="text-gray-300 text-xs dark:text-gray-700">—</span>}</TableCell>
              <TableCell className="text-xs text-gray-600 dark:text-gray-300">{h.contact_name || h.contact_phone || '—'}</TableCell>
              <TableCell className="text-xs text-gray-500 dark:text-gray-400">{h.latitude && h.longitude ? `${h.latitude.toFixed(4)}, ${h.longitude.toFixed(4)}` : '—'}</TableCell>
              <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <Users size={12} className="text-gray-400 dark:text-gray-400" />
                  {h.person_count ?? 0}
                </span>
              </TableCell>
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
