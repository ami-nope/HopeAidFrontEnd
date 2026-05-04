'use client';

import { useCallback, useEffect, useState } from 'react';

import { API_BASE_URL, ENDPOINTS } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, getAccessToken, refreshAccessToken } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';

interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

interface HookMeta {
  total_items: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CaseItem {
  id: string;
  organization_id: string;
  household_id?: string | null;
  reporter_user_id?: string | null;
  case_number: string;
  title: string;
  description: string | null;
  category: string;
  urgency_level: string;
  status: string;
  verification_status?: string;
  location_name: string | null;
  number_of_people_affected: number;
  risk_score: number | null;
  disaster_type: string | null;
  created_at: string;
  updated_at?: string;
}

export interface VolunteerItem {
  id: string;
  user_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  current_location_name: string | null;
  skills: string[] | null;
  languages: string[] | null;
  has_transport: boolean;
  has_medical_training: boolean;
  vehicle_type: string | null;
  duty_type: string;
  reliability_score: number;
  availability_status: string;
  active_assignment_count: number;
}

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  alert_type: string;
  severity: string;
  status: string;
  recipient_type: string;
  created_at: string;
  resolved_at: string | null;
}

export interface InventoryItemData {
  id: string;
  item_name: string;
  item_type: string;
  quantity: number;
  unit: string | null;
  status: string;
  location_name: string | null;
  minimum_threshold: number | null;
  created_at: string;
}

export interface HouseholdItem {
  id: string;
  household_name: string;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email?: string | null;
  person_count: number | null;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string | null;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  created_at: string;
}

interface DashboardRecentCase {
  id: string;
  case_number: string;
  title: string;
  urgency_level: string;
  status: string;
}

export interface DashboardSummary {
  total_cases: number;
  open_cases: number;
  critical_cases: number;
  total_volunteers: number;
  available_volunteers: number;
  total_households: number;
  low_stock_items: number;
  active_alerts: number;
  cases_by_status: Record<string, number>;
  cases_by_category: Record<string, number>;
  recent_cases: DashboardRecentCase[];
}

interface BackendAlertItem {
  id: string;
  type: string;
  message: string;
  status: string;
  recipient_type: string;
  created_at: string;
  resolved_at: string | null;
}

interface BackendAuditLogItem {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  actor_user_id: string | null;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  created_at: string;
}

function buildPath(
  basePath: string,
  params: Record<string, string | number | undefined> = {},
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function toHookMeta(meta: PaginationMeta): HookMeta {
  return {
    total_items: meta.total,
    page: meta.page,
    page_size: meta.page_size,
    total_pages: meta.total_pages,
  };
}

function toHookMetaFromTotal(total: number, page: number, pageSize: number): HookMeta {
  return {
    total_items: total,
    page,
    page_size: pageSize,
    total_pages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
  };
}

function getPageRange(page: number, pageSize: number) {
  const from = Math.max(0, (page - 1) * pageSize);
  return {
    from,
    to: from + pageSize - 1,
  };
}

function getOrganizationScope(user: { organization_id: string | null; role: string } | null) {
  const organizationId = user?.organization_id ?? null;
  return {
    organizationId,
    isGlobalSuperAdmin: user?.role === 'super_admin' && !organizationId,
  };
}

function normalizeNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const normalized = Number(value);
  return Number.isNaN(normalized) ? null : normalized;
}

function escapeIlikeValue(value: string) {
  return value.trim().replace(/[,%()*]/g, ' ');
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return error instanceof Error ? error.message : fallback;
}

function alertTitle(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function alertSeverity(type: string) {
  if (type === 'urgent_case' || type === 'unassigned_critical') return 'critical';
  if (type === 'conflict_detected') return 'high';
  if (type === 'inventory_low') return 'medium';
  return 'low';
}

function mapAlert(alert: BackendAlertItem): AlertItem {
  return {
    id: alert.id,
    title: alertTitle(alert.type),
    message: alert.message,
    alert_type: alert.type,
    severity: alertSeverity(alert.type),
    status: alert.status,
    recipient_type: alert.recipient_type,
    created_at: alert.created_at,
    resolved_at: alert.resolved_at,
  };
}

function mapAuditLog(log: BackendAuditLogItem): AuditLogItem {
  return {
    id: log.id,
    action: log.action_type,
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    user_id: log.actor_user_id,
    before_json: log.before_json,
    after_json: log.after_json,
    created_at: log.created_at,
  };
}

function useDeferredLoad(load: () => Promise<void>) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);
}

export function useDashboardSummary() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organizationId, isGlobalSuperAdmin } = getOrganizationScope(user);

  const fetch_ = useCallback(async () => {
    if (!organizationId && !isGlobalSuperAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        casesRes,
        openCasesRes,
        criticalCasesRes,
        volunteersRes,
        availableVolunteersRes,
        householdsRes,
        lowStockRes,
        alertsRes,
        recentCasesRes,
        statusRes,
        categoryRes,
      ] = await Promise.all([
        supabase.from('cases')
          .select('id', { count: 'exact', head: true })
          .match(organizationId ? { organization_id: organizationId } : {}),
        supabase.from('cases')
          .select('id', { count: 'exact', head: true })
          .match(organizationId ? { organization_id: organizationId } : {})
          .in('status', ['new', 'verified', 'assigned', 'in_progress']),
        supabase.from('cases')
          .select('id', { count: 'exact', head: true })
          .match(organizationId ? { organization_id: organizationId } : {})
          .eq('urgency_level', 'critical')
          .neq('status', 'closed'),
        supabase.from('volunteers')
          .select('id', { count: 'exact', head: true })
          .match(organizationId ? { organization_id: organizationId } : {}),
        supabase.from('volunteers')
          .select('id', { count: 'exact', head: true })
          .match(organizationId ? { organization_id: organizationId } : {})
          .eq('availability_status', 'available'),
        supabase.from('households')
          .select('id', { count: 'exact', head: true })
          .match(organizationId ? { organization_id: organizationId } : {}),
        supabase.from('inventory_items')
          .select('id', { count: 'exact', head: true })
          .match(organizationId ? { organization_id: organizationId } : {})
          .in('status', ['low_stock', 'out_of_stock']),
        supabase.from('alerts')
          .select('id', { count: 'exact', head: true })
          .match(organizationId ? { organization_id: organizationId } : {})
          .eq('status', 'active'),
        supabase.from('cases')
          .select('id,case_number,title,urgency_level,status')
          .match(organizationId ? { organization_id: organizationId } : {})
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('cases')
          .select('status')
          .match(organizationId ? { organization_id: organizationId } : {}),
        supabase.from('cases')
          .select('category')
          .match(organizationId ? { organization_id: organizationId } : {}),
      ]);

      const dashboardErrors = [
        casesRes.error,
        openCasesRes.error,
        criticalCasesRes.error,
        volunteersRes.error,
        availableVolunteersRes.error,
        householdsRes.error,
        lowStockRes.error,
        alertsRes.error,
        recentCasesRes.error,
        statusRes.error,
        categoryRes.error,
      ].filter(Boolean);

      if (dashboardErrors.length > 0) {
        throw dashboardErrors[0];
      }

      const casesByStatus: Record<string, number> = {};
      (statusRes.data || []).forEach((item: { status: string }) => {
        casesByStatus[item.status] = (casesByStatus[item.status] || 0) + 1;
      });

      setData({
        total_cases: casesRes.count ?? 0,
        open_cases: openCasesRes.count ?? 0,
        critical_cases: criticalCasesRes.count ?? 0,
        total_volunteers: volunteersRes.count ?? 0,
        available_volunteers: availableVolunteersRes.count ?? 0,
        total_households: householdsRes.count ?? 0,
        low_stock_items: lowStockRes.count ?? 0,
        active_alerts: alertsRes.count ?? 0,
        cases_by_status: casesByStatus,
        cases_by_category: (categoryRes.data || []).reduce<Record<string, number>>((acc, item: { category: string }) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {}),
        recent_cases: (recentCasesRes.data || []).map((item) => ({
          id: item.id,
          case_number: item.case_number,
          title: item.title,
          urgency_level: item.urgency_level,
          status: item.status,
        })),
      });
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, [isGlobalSuperAdmin, organizationId]);

  useDeferredLoad(fetch_);
  return { data, loading, error, refetch: fetch_ };
}

export function useCases(page = 1, pageSize = 20, status?: string, query?: string) {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [meta, setMeta] = useState<HookMeta>({
    total_items: 0,
    page,
    page_size: pageSize,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organizationId, isGlobalSuperAdmin } = getOrganizationScope(user);

  const fetch_ = useCallback(async () => {
    if (!organizationId && !isGlobalSuperAdmin) {
      setCases([]);
      setMeta(toHookMetaFromTotal(0, page, pageSize));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { from, to } = getPageRange(page, pageSize);
      let request = supabase
        .from('cases')
        .select(
          'id,organization_id,household_id,reporter_user_id,case_number,title,description,category,urgency_level,status,verification_status,location_name,number_of_people_affected,risk_score,disaster_type,created_at,updated_at',
          { count: 'exact' },
        );

      if (organizationId) {
        request = request.eq('organization_id', organizationId);
      }

      if (status) {
        request = request.eq('status', status);
      }

      const searchTerm = query ? escapeIlikeValue(query) : '';
      if (searchTerm) {
        request = request.or(
          `case_number.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location_name.ilike.%${searchTerm}%`,
        );
      }

      const { data, count, error } = await request
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      setCases(
        (data || []).map((item) => ({
          ...item,
          risk_score: normalizeNumber(item.risk_score),
        })),
      );
      setMeta(toHookMetaFromTotal(count ?? 0, page, pageSize));
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to load cases'));
    } finally {
      setLoading(false);
    }
  }, [isGlobalSuperAdmin, organizationId, page, pageSize, query, status]);

  useDeferredLoad(fetch_);
  return { cases, meta, loading, error, refetch: fetch_ };
}

export function useVolunteers(page = 1, pageSize = 20) {
  const { user } = useAuth();
  const [volunteers, setVolunteers] = useState<VolunteerItem[]>([]);
  const [meta, setMeta] = useState<HookMeta>({
    total_items: 0,
    page,
    page_size: pageSize,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organizationId, isGlobalSuperAdmin } = getOrganizationScope(user);

  const fetch_ = useCallback(async () => {
    if (!organizationId && !isGlobalSuperAdmin) {
      setVolunteers([]);
      setMeta(toHookMetaFromTotal(0, page, pageSize));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { from, to } = getPageRange(page, pageSize);
      let request = supabase
        .from('volunteers')
        .select(
          'id,user_id,name,phone,email,current_location_name,skills,languages,has_transport,has_medical_training,vehicle_type,duty_type,reliability_score,availability_status,active_assignment_count',
          { count: 'exact' },
        );

      if (organizationId) {
        request = request.eq('organization_id', organizationId);
      }

      const { data, count, error } = await request.range(from, to);

      if (error) {
        throw error;
      }

      setVolunteers(
        (data || []).map((item) => ({
          ...item,
          reliability_score: normalizeNumber(item.reliability_score) ?? 0,
        })),
      );
      setMeta(toHookMetaFromTotal(count ?? 0, page, pageSize));
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to load volunteers'));
    } finally {
      setLoading(false);
    }
  }, [isGlobalSuperAdmin, organizationId, page, pageSize]);

  useDeferredLoad(fetch_);
  return { volunteers, meta, loading, error, refetch: fetch_ };
}

export function useAlerts(page = 1, pageSize = 20) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [meta, setMeta] = useState<HookMeta>({
    total_items: 0,
    page,
    page_size: pageSize,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organizationId, isGlobalSuperAdmin } = getOrganizationScope(user);

  const fetch_ = useCallback(async () => {
    if (!organizationId && !isGlobalSuperAdmin) {
      setAlerts([]);
      setMeta(toHookMetaFromTotal(0, page, pageSize));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { from, to } = getPageRange(page, pageSize);
      let request = supabase
        .from('alerts')
        .select('id,type,message,status,recipient_type,created_at,resolved_at', { count: 'exact' })
        .eq('status', 'active');

      if (organizationId) {
        request = request.eq('organization_id', organizationId);
      }

      const { data, count, error } = await request
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      setAlerts((data || []).map(mapAlert));
      setMeta(toHookMetaFromTotal(count ?? 0, page, pageSize));
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to load alerts'));
    } finally {
      setLoading(false);
    }
  }, [isGlobalSuperAdmin, organizationId, page, pageSize]);

  useDeferredLoad(fetch_);
  return { alerts, meta, loading, error, refetch: fetch_ };
}

export function useInventory(page = 1, pageSize = 20) {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItemData[]>([]);
  const [meta, setMeta] = useState<HookMeta>({
    total_items: 0,
    page,
    page_size: pageSize,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organizationId, isGlobalSuperAdmin } = getOrganizationScope(user);

  const fetch_ = useCallback(async () => {
    if (!organizationId && !isGlobalSuperAdmin) {
      setItems([]);
      setMeta(toHookMetaFromTotal(0, page, pageSize));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { from, to } = getPageRange(page, pageSize);
      let request = supabase
        .from('inventory_items')
        .select(
          'id,item_name,item_type,quantity,unit,status,location_name,minimum_threshold,created_at',
          { count: 'exact' },
        );

      if (organizationId) {
        request = request.eq('organization_id', organizationId);
      }

      const { data, count, error } = await request.range(from, to);

      if (error) {
        throw error;
      }

      setItems(
        (data || []).map((item) => ({
          ...item,
          quantity: normalizeNumber(item.quantity) ?? 0,
          minimum_threshold: normalizeNumber(item.minimum_threshold),
        })),
      );
      setMeta(toHookMetaFromTotal(count ?? 0, page, pageSize));
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to load inventory'));
    } finally {
      setLoading(false);
    }
  }, [isGlobalSuperAdmin, organizationId, page, pageSize]);

  useDeferredLoad(fetch_);
  return { items, meta, loading, error, refetch: fetch_ };
}

export function useHouseholds(page = 1, pageSize = 20) {
  const { user } = useAuth();
  const [households, setHouseholds] = useState<HouseholdItem[]>([]);
  const [meta, setMeta] = useState<HookMeta>({
    total_items: 0,
    page,
    page_size: pageSize,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organizationId, isGlobalSuperAdmin } = getOrganizationScope(user);

  const fetch_ = useCallback(async () => {
    if (!organizationId && !isGlobalSuperAdmin) {
      setHouseholds([]);
      setMeta(toHookMetaFromTotal(0, page, pageSize));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { from, to } = getPageRange(page, pageSize);
      let request = supabase
        .from('households')
        .select(
          'id,household_name,location_name,latitude,longitude,contact_name,contact_phone,contact_email',
          { count: 'exact' },
        );

      if (organizationId) {
        request = request.eq('organization_id', organizationId);
      }

      const { data, count, error } = await request.range(from, to);

      if (error) {
        throw error;
      }

      setHouseholds((data || []).map((item) => ({
        ...item,
        latitude: normalizeNumber(item.latitude),
        longitude: normalizeNumber(item.longitude),
        person_count: 0,
      })));
      setMeta(toHookMetaFromTotal(count ?? 0, page, pageSize));
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to load households'));
    } finally {
      setLoading(false);
    }
  }, [isGlobalSuperAdmin, organizationId, page, pageSize]);

  useDeferredLoad(fetch_);
  return { households, meta, loading, error, refetch: fetch_ };
}

export function useAuditLogs(page = 1, pageSize = 20, entityType?: string) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [meta, setMeta] = useState<HookMeta>({
    total_items: 0,
    page,
    page_size: pageSize,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const path = buildPath(ENDPOINTS.adminAuditLogs, {
        page,
        page_size: pageSize,
        entity_type: entityType,
      });
      const res = await apiFetch<PaginatedResponse<BackendAuditLogItem>>(path);
      setLogs(res.data.map(mapAuditLog));
      setMeta(toHookMeta(res.meta));
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to load audit logs'));
    } finally {
      setLoading(false);
    }
  }, [entityType, page, pageSize]);

  useDeferredLoad(fetch_);
  return { logs, meta, loading, error, refetch: fetch_ };
}

export function downloadExport(endpoint: string, filename: string) {
  const fetchExport = async () => {
    const request = async () => {
      const token = getAccessToken();
      return fetch(`${API_BASE_URL}${endpoint}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    };

    let response = await request();
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        response = await request();
      }
    }

    if (!response.ok) {
      console.error(`Export failed with status ${response.status}`);
      return;
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  };

  void fetchExport();
}
