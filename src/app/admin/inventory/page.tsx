'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, TableRow, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useInventory } from '@/hooks/useData';
import { ChevronLeft, ChevronRight, RefreshCw, MapPin } from 'lucide-react';

function statusVariant(s: string): 'success' | 'warning' | 'danger' | 'default' {
  return { available: 'success', low_stock: 'warning', out_of_stock: 'danger', expired: 'danger' }[s] as 'success' | 'warning' | 'danger' | 'default' || 'default';
}

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const { items, meta, loading, refetch } = useInventory(page, 15);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-300">Track supplies and resources ({meta?.total_items ?? 0} items).</p>
        </div>
        <Button variant="ghost" size="sm" onClick={refetch} className="gap-2 text-gray-500 dark:text-gray-300"><RefreshCw size={15} /> Refresh</Button>
      </div>

      <Card>
        <Table headers={['Item', 'Type', 'Quantity', 'Unit', 'Status', 'Location', 'Min Threshold']}>
          {loading ? Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><div className="h-4 w-16 bg-gray-200 rounded animate-pulse dark:bg-gray-800" /></TableCell>)}</TableRow>
          )) : items.length === 0 ? (
            <TableRow><TableCell className="text-center text-gray-400 py-8 dark:text-gray-500">No inventory items.</TableCell></TableRow>
          ) : items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium text-gray-900 dark:text-gray-100">{item.item_name}</TableCell>
              <TableCell className="capitalize text-xs text-gray-700 dark:text-gray-300">{item.item_type}</TableCell>
              <TableCell className="font-medium dark:text-gray-300">{item.quantity}</TableCell>
              <TableCell className="text-xs text-gray-600 dark:text-gray-400">{item.unit}</TableCell>
              <TableCell><Badge variant={statusVariant(item.status)}>{item.status.replace(/_/g, ' ')}</Badge></TableCell>
              <TableCell>{item.location_name ? <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300"><MapPin size={12} />{item.location_name}</div> : <span className="text-gray-300 text-xs dark:text-gray-700">—</span>}</TableCell>
              <TableCell className="text-xs text-gray-600 dark:text-gray-400">{item.minimum_threshold}</TableCell>
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
