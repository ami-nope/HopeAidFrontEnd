'use client';

import { useCallback, useEffect, useState } from 'react';

import { API_BASE_URL, ENDPOINTS } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, getAccessToken, refreshAccessToken } from '@/lib/api-client';
import { cacheManager, DEFAULT_CACHE_TTL, getDataSensitivity } from '@/lib/cache';

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

interface ApiResponse<T> {
  success: boolean;
  data: T;
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

export interface AlertDecisions {
  danger_for_community?: boolean;
  can_be_solved?: boolean;
  danger_on_volunteers?: boolean;
}

export interface AlertMetadata {
  kind?: string;
  heading?: string | null;
  description?: string | null;
  full_text?: string | null;
  solution?: string | null;
  severity?: string | null;
  risk_band?: string | null;
  decisions?: AlertDecisions | null;
  providers?: Record<string, unknown> | null;
  weather?: Record<string, unknown> | null;
  assessment_id?: string | null;
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
  metadata_json?: AlertMetadata | null;
}

export type AlertFeedStatus = 'active' | 'resolved' | 'acknowledged' | 'all';

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

interface BackendDashboardRecentCase {
  id: string;
  case_number: string;
  title: string;
  urgency?: string;
  urgency_level?: string;
  status: string;
}

interface BackendDashboardSummary {
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
  recent_cases: BackendDashboardRecentCase[];
}

interface BackendAlertItem {
  id: string;
  type: string;
  message: string;
  status: string;
  recipient_type: string;
  created_at: string;
  resolved_at: string | null;
  metadata_json?: AlertMetadata | null;
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return error instanceof Error ? error.message : fallback;
}

function normalizeNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const normalized = Number(value);
  return Number.isNaN(normalized) ? null : normalized;
}

function normalizeDashboardSummary(data: BackendDashboardSummary): DashboardSummary {
  return {
    ...data,
    recent_cases: (data.recent_cases || []).map((item) => ({
      id: item.id,
      case_number: item.case_number,
      title: item.title,
      urgency_level: item.urgency_level || item.urgency || 'medium',
      status: item.status,
    })),
  };
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
  const metadata = alert.metadata_json || null;
  return {
    id: alert.id,
    title: metadata?.heading || alertTitle(alert.type),
    message: metadata?.description || alert.message,
    alert_type: alert.type,
    severity: metadata?.severity || alertSeverity(alert.type),
    status: alert.status,
    recipient_type: alert.recipient_type,
    created_at: alert.created_at,
    resolved_at: alert.resolved_at,
    metadata_json: metadata,
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
  const cacheScope = user ? `${user.organization_id ?? 'global'}_${user.role}` : 'unknown';

  const fetch_ = useCallback(async () => {
    const cacheKey = `dashboard_${cacheScope}`;
    const sensitivity = getDataSensitivity(cacheKey);
    const cachedData = cacheManager.get<DashboardSummary>(cacheKey, DEFAULT_CACHE_TTL.DASHBOARD, sensitivity);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<ApiResponse<BackendDashboardSummary>>(ENDPOINTS.dashboardSummary);
      const dashboardData = normalizeDashboardSummary(res.data);
      setData(dashboardData);
      cacheManager.set(cacheKey, dashboardData, sensitivity);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, [cacheScope]);

  useEffect(() => {
    const cacheKey = `dashboard_${cacheScope}`;
    const initialLoadId = window.setTimeout(() => {
      void fetch_();
    }, 0);

    cacheManager.setRefreshInterval(cacheKey, DEFAULT_CACHE_TTL.DASHBOARD, fetch_);

    return () => {
      window.clearTimeout(initialLoadId);
      cacheManager.clearRefreshInterval(cacheKey);
    };
  }, [cacheScope, fetch_]);

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
  const cacheScope = user ? `${user.organization_id ?? 'global'}_${user.role}` : 'unknown';

  const fetch_ = useCallback(async () => {
    const cacheKey = `cases_${cacheScope}_${page}_${pageSize}_${status ?? ''}_${query ?? ''}`;
    const sensitivity = getDataSensitivity(cacheKey);
    const cachedData = cacheManager.get<{ cases: CaseItem[]; meta: HookMeta }>(
      cacheKey,
      DEFAULT_CACHE_TTL.CASES,
      sensitivity,
    );
    if (cachedData) {
      setCases(cachedData.cases);
      setMeta(cachedData.meta);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const path = buildPath(ENDPOINTS.cases, {
        page,
        page_size: pageSize,
        status,
        q: query,
      });
      const res = await apiFetch<PaginatedResponse<CaseItem>>(path);
      const casesData = (res.data || []).map((item) => ({
        ...item,
        risk_score: normalizeNumber(item.risk_score),
      }));
      const metaData = toHookMeta(res.meta);

      setCases(casesData);
      setMeta(metaData);
      cacheManager.set(cacheKey, { cases: casesData, meta: metaData }, sensitivity);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load cases'));
    } finally {
      setLoading(false);
    }
  }, [cacheScope, page, pageSize, query, status]);

  useDeferredLoad(fetch_);
  return { cases, meta, loading, error, refetch: fetch_ };
}

export function useMyAssignedCases(page = 1, pageSize = 20) {
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
  const cacheScope = user ? `${user.organization_id ?? 'global'}_${user.role}` : 'unknown';

  const fetch_ = useCallback(async () => {
    const cacheKey = `my_assigned_cases_${cacheScope}_${page}_${pageSize}`;
    const sensitivity = getDataSensitivity(cacheKey);
    const cachedData = cacheManager.get<{ cases: CaseItem[]; meta: HookMeta }>(
      cacheKey,
      DEFAULT_CACHE_TTL.CASES,
      sensitivity,
    );
    if (cachedData) {
      setCases(cachedData.cases);
      setMeta(cachedData.meta);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const path = buildPath(ENDPOINTS.casesAssignedMe, {
        page,
        page_size: pageSize,
      });
      const res = await apiFetch<PaginatedResponse<CaseItem>>(path);
      const casesData = (res.data || []).map((item) => ({
        ...item,
        risk_score: normalizeNumber(item.risk_score),
      }));
      const metaData = toHookMeta(res.meta);

      setCases(casesData);
      setMeta(metaData);
      cacheManager.set(cacheKey, { cases: casesData, meta: metaData }, sensitivity);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load assigned cases'));
    } finally {
      setLoading(false);
    }
  }, [cacheScope, page, pageSize]);

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
  const cacheScope = user ? `${user.organization_id ?? 'global'}_${user.role}` : 'unknown';

  const fetch_ = useCallback(async () => {
    const cacheKey = `volunteers_${cacheScope}_${page}_${pageSize}`;
    const sensitivity = getDataSensitivity(cacheKey);
    const cachedData = cacheManager.get<{ volunteers: VolunteerItem[]; meta: HookMeta }>(
      cacheKey,
      DEFAULT_CACHE_TTL.VOLUNTEERS,
      sensitivity,
    );
    if (cachedData) {
      setVolunteers(cachedData.volunteers);
      setMeta(cachedData.meta);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const path = buildPath(ENDPOINTS.volunteers, {
        page,
        page_size: pageSize,
      });
      const res = await apiFetch<PaginatedResponse<VolunteerItem>>(path);
      const volunteersData = (res.data || []).map((item) => ({
        ...item,
        reliability_score: normalizeNumber(item.reliability_score) ?? 0,
      }));
      const metaData = toHookMeta(res.meta);

      setVolunteers(volunteersData);
      setMeta(metaData);
      cacheManager.set(cacheKey, { volunteers: volunteersData, meta: metaData }, sensitivity);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load volunteers'));
    } finally {
      setLoading(false);
    }
  }, [cacheScope, page, pageSize]);

  useDeferredLoad(fetch_);
  return { volunteers, meta, loading, error, refetch: fetch_ };
}

export function useAlerts(page = 1, pageSize = 20, status: AlertFeedStatus = 'active') {
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
  const cacheScope = user ? `${user.organization_id ?? 'global'}_${user.role}` : 'unknown';

  const fetch_ = useCallback(async () => {
    const cacheKey = `alerts_${cacheScope}_${status}_${page}_${pageSize}`;
    const sensitivity = getDataSensitivity(cacheKey);
    const cachedData = cacheManager.get<{ alerts: AlertItem[]; meta: HookMeta }>(
      cacheKey,
      DEFAULT_CACHE_TTL.ALERTS,
      sensitivity,
    );
    if (cachedData) {
      setAlerts(cachedData.alerts);
      setMeta(cachedData.meta);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const path = buildPath(ENDPOINTS.alerts, {
        page,
        page_size: pageSize,
        status,
      });
      const res = await apiFetch<PaginatedResponse<BackendAlertItem>>(path);
      const alertsData = (res.data || []).map(mapAlert);
      const metaData = toHookMeta(res.meta);

      setAlerts(alertsData);
      setMeta(metaData);
      cacheManager.set(cacheKey, { alerts: alertsData, meta: metaData }, sensitivity);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load alerts'));
    } finally {
      setLoading(false);
    }
  }, [cacheScope, page, pageSize, status]);

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
  const cacheScope = user ? `${user.organization_id ?? 'global'}_${user.role}` : 'unknown';

  const fetch_ = useCallback(async () => {
    const cacheKey = `inventory_${cacheScope}_${page}_${pageSize}`;
    const sensitivity = getDataSensitivity(cacheKey);
    const cachedData = cacheManager.get<{ items: InventoryItemData[]; meta: HookMeta }>(
      cacheKey,
      DEFAULT_CACHE_TTL.INVENTORY,
      sensitivity,
    );
    if (cachedData) {
      setItems(cachedData.items);
      setMeta(cachedData.meta);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const path = buildPath(ENDPOINTS.inventoryItems, {
        page,
        page_size: pageSize,
      });
      const res = await apiFetch<PaginatedResponse<InventoryItemData>>(path);
      const itemsData = (res.data || []).map((item) => ({
        ...item,
        quantity: normalizeNumber(item.quantity) ?? 0,
        minimum_threshold: normalizeNumber(item.minimum_threshold),
      }));
      const metaData = toHookMeta(res.meta);

      setItems(itemsData);
      setMeta(metaData);
      cacheManager.set(cacheKey, { items: itemsData, meta: metaData }, sensitivity);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load inventory'));
    } finally {
      setLoading(false);
    }
  }, [cacheScope, page, pageSize]);

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
  const cacheScope = user ? `${user.organization_id ?? 'global'}_${user.role}` : 'unknown';

  const fetch_ = useCallback(async () => {
    const cacheKey = `households_${cacheScope}_${page}_${pageSize}`;
    const sensitivity = getDataSensitivity(cacheKey);
    const cachedData = cacheManager.get<{ households: HouseholdItem[]; meta: HookMeta }>(
      cacheKey,
      DEFAULT_CACHE_TTL.HOUSEHOLDS,
      sensitivity,
    );
    if (cachedData) {
      setHouseholds(cachedData.households);
      setMeta(cachedData.meta);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const path = buildPath(ENDPOINTS.households, {
        page,
        page_size: pageSize,
      });
      const res = await apiFetch<PaginatedResponse<HouseholdItem>>(path);
      const householdsData = (res.data || []).map((item) => ({
        ...item,
        latitude: normalizeNumber(item.latitude),
        longitude: normalizeNumber(item.longitude),
        person_count: item.person_count ?? 0,
      }));
      const metaData = toHookMeta(res.meta);

      setHouseholds(householdsData);
      setMeta(metaData);
      cacheManager.set(cacheKey, { households: householdsData, meta: metaData }, sensitivity);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load households'));
    } finally {
      setLoading(false);
    }
  }, [cacheScope, page, pageSize]);

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
    const cacheKey = `audit_logs_${page}_${pageSize}_${entityType}`;
    const sensitivity = getDataSensitivity(cacheKey);
    const cachedData = cacheManager.get<{ logs: AuditLogItem[]; meta: HookMeta }>(
      cacheKey,
      DEFAULT_CACHE_TTL.AUDIT_LOGS,
      sensitivity,
    );
    if (cachedData) {
      setLogs(cachedData.logs);
      setMeta(cachedData.meta);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const path = buildPath(ENDPOINTS.adminAuditLogs, {
        page,
        page_size: pageSize,
        entity_type: entityType,
      });
      const res = await apiFetch<PaginatedResponse<BackendAuditLogItem>>(path);
      const logsData = res.data.map(mapAuditLog);
      const metaData = toHookMeta(res.meta);

      setLogs(logsData);
      setMeta(metaData);
      cacheManager.set(cacheKey, { logs: logsData, meta: metaData }, sensitivity);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load audit logs'));
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
