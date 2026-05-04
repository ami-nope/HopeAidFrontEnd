'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableRow, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InputField } from '@/components/ui/InputField';
import { useDashboardSummary, downloadExport } from '@/hooks/useData';
import { ENDPOINTS } from '@/config/api';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { getPortalBasePath, hasPermission } from '@/lib/rbac';
import {
  FolderKanban, Users, Package, AlertTriangle, Plus, ArrowRight,
  RefreshCw, Home, Download, Zap, ShieldAlert, Loader2, Inbox,
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

function statusToBadgeVariant(status: string): 'danger' | 'success' | 'warning' | 'info' | 'default' {
  return ({ new: 'info', verified: 'info', assigned: 'success', in_progress: 'success', resolved: 'default', closed: 'default', rejected: 'danger' } as Record<string, 'danger' | 'success' | 'warning' | 'info' | 'default'>)[status] || 'default';
}
function urgencyToBadgeVariant(u: string): 'danger' | 'warning' | 'info' | 'default' {
  return ({ critical: 'danger', high: 'danger', medium: 'warning', low: 'info' } as Record<string, 'danger' | 'warning' | 'info' | 'default'>)[u] || 'default';
}

function SkeletonRow() {
  return <TableRow>{[1,2,3,4].map(i => <TableCell key={i}><div className="h-4 w-20 bg-gray-200 rounded animate-pulse dark:bg-gray-700" /></TableCell>)}</TableRow>;
}
function StatSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-950/5 dark:border-gray-800 dark:bg-[#0a0a0a] dark:shadow-none">
      <div className="flex items-center justify-between mb-4"><div className="h-4 w-24 bg-gray-200 rounded dark:bg-gray-700" /><div className="h-10 w-10 bg-gray-200 rounded-lg dark:bg-gray-700" /></div>
      <div className="h-8 w-16 bg-gray-200 rounded dark:bg-gray-700" />
    </div>
  );
}

interface OrgItem {
  id: string;
  name: string;
  slug: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
}

export default function AdminDashboard() {
  const { user, permissions } = useAuth();
  const isDevAdmin = user?.role === 'super_admin';
  const canCreateCases = hasPermission(permissions, 'cases:create');
  const basePath = getPortalBasePath(user?.role);
  const { data: summary, loading, refetch } = useDashboardSummary();
  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [caseTitle, setCaseTitle] = useState('');
  const [caseLocation, setCaseLocation] = useState('');
  const [caseUrgency, setCaseUrgency] = useState('medium');
  const [caseCategory, setCaseCategory] = useState('other');
  const [caseDescription, setCaseDescription] = useState('');
  const [casePeople, setCasePeople] = useState('1');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (!isDevAdmin) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void apiFetch<PaginatedResponse<OrgItem>>(`${ENDPOINTS.orgs}?page=1&page_size=100`)
        .then((res) => {
          setOrgs(res.data || []);
          if (res.data?.[0]?.id && !selectedOrgId) {
            setSelectedOrgId(res.data[0].id);
          }
        })
        .catch(() => undefined);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isDevAdmin, selectedOrgId]);

  const handleCreateCase = async () => {
    if (!canCreateCases) { setCreateError('Your role cannot create cases'); return; }
    if (!caseTitle.trim()) { setCreateError('Title is required'); return; }
    if (isDevAdmin && !selectedOrgId) { setCreateError('Select organization'); return; }
    setCreating(true);
    setCreateError('');

    try {
      await apiFetch(ENDPOINTS.cases, {
        method: 'POST',
        body: {
          ...(isDevAdmin ? { organization_id: selectedOrgId } : {}),
          title: caseTitle.trim(),
          description: caseDescription.trim() || null,
          category: caseCategory,
          urgency_level: caseUrgency,
          location_name: caseLocation.trim() || null,
          number_of_people_affected: parseInt(casePeople, 10) || 1,
          source_type: 'manual',
        },
      });

      setIsModalOpen(false);
      setCaseTitle('');
      setCaseLocation('');
      setCaseUrgency('medium');
      setCaseCategory('other');
      setCaseDescription('');
      setCasePeople('1');
      await refetch();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Unable to create case');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-300">Live organization metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={refetch} className="gap-2 text-gray-500 dark:text-gray-300"><RefreshCw size={15} /> Refresh</Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadExport(ENDPOINTS.exportCasesCSV, 'cases.csv')}><Download size={15} /> Export CSV</Button>
          {canCreateCases && <Button className="gap-2" onClick={() => setIsModalOpen(true)}><Plus size={16} /> Create Case</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? <>{[1,2,3,4].map(i => <StatSkeleton key={i} />)}</> : (
          <>
            <StatCard title="Total Cases" value={String(summary?.total_cases ?? 0)} icon={<FolderKanban size={20} />} trend={`${summary?.open_cases ?? 0} open`} trendUp />
            <StatCard title="Total Volunteers" value={String(summary?.total_volunteers ?? 0)} icon={<Users size={20} />} trend={`${summary?.available_volunteers ?? 0} available`} trendUp />
            <StatCard title="Households" value={String(summary?.total_households ?? 0)} icon={<Home size={20} />} />
            <StatCard title="Active Alerts" value={String(summary?.active_alerts ?? 0)} icon={<AlertTriangle size={20} className="text-red-500" />} trend={`${summary?.critical_cases ?? 0} critical cases`} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5"><div className="flex items-center gap-3 mb-3"><div className="h-9 w-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center dark:bg-orange-900/30 dark:text-orange-400"><Package size={18} /></div><div><p className="text-xs text-gray-500 dark:text-gray-300">Low Stock Items</p><p className="text-xl font-bold text-gray-900 dark:text-gray-100">{summary?.low_stock_items ?? 0}</p></div></div></Card>
        <Card className="p-5"><div className="flex items-center gap-3 mb-3"><div className="h-9 w-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center dark:bg-red-900/30 dark:text-red-400"><ShieldAlert size={18} /></div><div><p className="text-xs text-gray-500 dark:text-gray-300">Critical Cases</p><p className="text-xl font-bold text-gray-900 dark:text-gray-100">{summary?.critical_cases ?? 0}</p></div></div></Card>
        <Card className="p-5"><div className="flex items-center gap-3 mb-3"><div className="h-9 w-9 rounded-lg bg-green-100 text-green-600 flex items-center justify-center dark:bg-green-900/30 dark:text-green-400"><Zap size={18} /></div><div><p className="text-xs text-gray-500 dark:text-gray-300">Available Volunteers</p><p className="text-xl font-bold text-gray-900 dark:text-gray-100">{summary?.available_volunteers ?? 0}</p></div></div></Card>
      </div>

      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Cases by Status</CardTitle></CardHeader>
            <CardContent><div className="space-y-3">
              {Object.entries(summary.cases_by_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge variant={statusToBadgeVariant(status)}>{status.replace(/_/g, ' ')}</Badge>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              ))}
              {Object.keys(summary.cases_by_status).length === 0 && (
                <EmptyState 
                  icon={Inbox} 
                  title="No cases yet" 
                  description="Status distribution will appear here once cases are created." 
                  className="border-0 bg-transparent py-6 min-h-0" 
                />
              )}
            </div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Cases by Category</CardTitle></CardHeader>
            <CardContent><div className="space-y-3">
              {Object.entries(summary.cases_by_category).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 capitalize dark:text-gray-300">{cat}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-800"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(100, (count / (summary.total_cases || 1)) * 100)}%` }} /></div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right dark:text-gray-100">{count}</span>
                  </div>
                </div>
              ))}
              {Object.keys(summary.cases_by_category).length === 0 && (
                <EmptyState 
                  icon={Inbox} 
                  title="No cases yet" 
                  description="Category distribution will appear here once cases are created." 
                  className="border-0 bg-transparent py-6 min-h-0" 
                />
              )}
            </div></CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Cases</CardTitle>
          <Link href={`${basePath}/cases`} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
            View All <ArrowRight size={14} />
          </Link>
        </CardHeader>
        {loading ? (
          <Table headers={['Case #', 'Title', 'Status', 'Urgency']}><SkeletonRow /><SkeletonRow /><SkeletonRow /></Table>
        ) : summary && summary.recent_cases.length > 0 ? (
          <Table headers={['Case #', 'Title', 'Status', 'Urgency']}>
            {summary.recent_cases.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs font-medium text-gray-900 dark:text-gray-100">{c.case_number}</TableCell>
                <TableCell className="font-medium text-gray-900 dark:text-gray-100">{c.title}</TableCell>
                <TableCell><Badge variant={statusToBadgeVariant(c.status)}>{c.status.replace(/_/g, ' ')}</Badge></TableCell>
                <TableCell><Badge variant={urgencyToBadgeVariant(c.urgency_level)}>{c.urgency_level}</Badge></TableCell>
              </TableRow>
            ))}
          </Table>
        ) : (
          <EmptyState 
            icon={Inbox} 
            title="No cases found" 
            description="There are currently no recent cases to display." 
            className="border-0 bg-transparent py-14" 
          />
        )}
      </Card>

      {/* Create Case modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setCreateError(''); }} title="Create New Case"
        footer={<>
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateCase} disabled={creating} className="gap-2">
            {creating && <Loader2 size={16} className="animate-spin" />}
            {creating ? 'Creating…' : 'Create Case'}
          </Button>
        </>}
      >
        <div className="space-y-4 py-2">
          {createError && <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{createError}</div>}
          {isDevAdmin && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Organization</label>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="block w-full rounded-lg border-gray-300 border bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              >
                <option value="">Select organization</option>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.slug})
                  </option>
                ))}
              </select>
            </div>
          )}
          <InputField label="Case Title" placeholder="E.g., Medical Emergency at Sector 4" value={caseTitle} onChange={(e) => setCaseTitle(e.target.value)} />
          <InputField label="Location" placeholder="Enter address or area name" value={caseLocation} onChange={(e) => setCaseLocation(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
              <select value={caseCategory} onChange={(e) => setCaseCategory(e.target.value)} className="block w-full rounded-lg border-gray-300 border bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100">
                <option value="food">Food</option><option value="water">Water</option><option value="shelter">Shelter</option>
                <option value="medical">Medical</option><option value="clothing">Clothing</option><option value="logistics">Logistics</option><option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Urgency</label>
              <select value={caseUrgency} onChange={(e) => setCaseUrgency(e.target.value)} className="block w-full rounded-lg border-gray-300 border bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <InputField label="People Affected" type="number" placeholder="1" value={casePeople} onChange={(e) => setCasePeople(e.target.value)} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea rows={3} value={caseDescription} onChange={(e) => setCaseDescription(e.target.value)} className="block w-full rounded-lg border-gray-300 border bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500" placeholder="Provide details…" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
