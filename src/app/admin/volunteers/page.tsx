'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, TableRow, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useVolunteers, VolunteerItem } from '@/hooks/useData';
import { getDisplayEmail } from '@/lib/contact';
import { ChevronLeft, ChevronRight, RefreshCw, MapPin, Phone, Mail, Star, Users } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

function availabilityVariant(s: string): 'success' | 'warning' | 'danger' | 'default' {
  return { available: 'success', busy: 'warning', unavailable: 'danger', on_leave: 'default' }[s] as 'success' | 'warning' | 'danger' | 'default' || 'default';
}

export default function AdminVolunteersPage() {
  const [page, setPage] = useState(1);
  const { volunteers, meta, loading, refetch } = useVolunteers(page, 15);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Volunteers</h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-300">Manage all volunteers ({meta?.total_items ?? 0} total).</p>
        </div>
        <Button variant="ghost" size="sm" onClick={refetch} className="gap-2 text-gray-500 dark:text-gray-300">
          <RefreshCw size={15} /> Refresh
        </Button>
      </div>

      <Card>
        <Table headers={['Name', 'Contact', 'Location', 'Skills', 'Status', 'Duty', 'Assignments', 'Reliability']}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 8 }).map((_, j) => (
                  <TableCell key={j}><div className="h-4 w-16 bg-gray-200 rounded animate-pulse dark:bg-gray-800" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : volunteers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="p-0 border-0">
                <EmptyState 
                  icon={Users} 
                  title="No volunteers found" 
                  description="There are currently no volunteers registered in the system." 
                  className="border-0 bg-transparent py-14" 
                />
              </TableCell>
            </TableRow>
          ) : (
            volunteers.map((v: VolunteerItem) => (
              <TableRow key={v.id}>
                <TableCell>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{v.name}</div>
                  {v.languages && v.languages.length > 0 && (
                    <div className="text-[11px] text-gray-400 mt-0.5 dark:text-gray-500">{v.languages.join(', ')}</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    {getDisplayEmail(v.email) && <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300"><Mail size={11} />{getDisplayEmail(v.email)}</div>}
                    {v.phone && <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300"><Phone size={11} />{v.phone}</div>}
                  </div>
                </TableCell>
                <TableCell>
                  {v.current_location_name ? (
                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300"><MapPin size={12} />{v.current_location_name}</div>
                  ) : <span className="text-gray-300 text-xs dark:text-gray-700">—</span>}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {v.skills && v.skills.length > 0 ? v.skills.slice(0, 3).map((s) => (
                      <span key={s} className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] dark:bg-gray-800 dark:text-gray-300">{s}</span>
                    )) : <span className="text-gray-300 text-xs dark:text-gray-700">—</span>}
                    {v.skills && v.skills.length > 3 && <span className="text-[11px] text-gray-400 dark:text-gray-500">+{v.skills.length - 3}</span>}
                  </div>
                </TableCell>
                <TableCell><Badge variant={availabilityVariant(v.availability_status)}>{v.availability_status.replace(/_/g, ' ')}</Badge></TableCell>
                <TableCell className="capitalize text-xs text-gray-700 dark:text-gray-300">{v.duty_type.replace(/_/g, ' ')}</TableCell>
                <TableCell className="text-center font-medium dark:text-gray-300">{v.active_assignment_count}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-xs dark:text-gray-300">
                    <Star size={12} className="text-yellow-500 dark:text-yellow-400" />
                    <span className="font-medium">{v.reliability_score.toFixed(1)}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
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
