function getDefaultApiBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:8000';
  }

  const { protocol, hostname } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const apiProtocol = protocol === 'https:' ? 'https:' : 'http:';

  if (isLocalhost) {
    return `${apiProtocol}//localhost:8000`;
  }

  return '/api-proxy';
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || getDefaultApiBaseUrl();

export const API_PREFIX = '/api/v1';

export const ENDPOINTS = {
  // ── Auth ───────────────────────────────────────────────────────────────────
  login: `${API_PREFIX}/auth/login`,
  register: `${API_PREFIX}/auth/register`,
  me: `${API_PREFIX}/auth/me`,
  refresh: `${API_PREFIX}/auth/refresh`,
  logout: `${API_PREFIX}/auth/logout`,

  // ── Cases ──────────────────────────────────────────────────────────────────
  cases: `${API_PREFIX}/cases`,
  casesAssignedMe: `${API_PREFIX}/cases/assigned/me`,
  casesWeatherRun: `${API_PREFIX}/cases/weather-intelligence/run`,
  // GET/PUT/DELETE: `${ENDPOINTS.cases}/${caseId}`
  // POST: `${ENDPOINTS.cases}/${caseId}/approve`
  // POST: `${ENDPOINTS.cases}/${caseId}/reject`
  // POST: `${ENDPOINTS.cases}/${caseId}/close`
  // POST: `${ENDPOINTS.cases}/${caseId}/assign`
  // POST: `${ENDPOINTS.cases}/${caseId}/recalculate-risk`
  // POST: `${ENDPOINTS.cases}/${caseId}/duplicate-check`
  // POST: `${ENDPOINTS.cases}/${caseId}/refresh-location`
  // POST: `${ENDPOINTS.cases}/${caseId}/weather-intelligence`

  // ── Volunteers ─────────────────────────────────────────────────────────────
  volunteers: `${API_PREFIX}/volunteers`,
  // GET/PUT: `${ENDPOINTS.volunteers}/${volId}`
  // POST/GET: `${ENDPOINTS.volunteers}/${volId}/availability`

  // ── Organizations ──────────────────────────────────────────────────────────
  orgs: `${API_PREFIX}/orgs`,

  // ── Alerts ─────────────────────────────────────────────────────────────────
  alerts: `${API_PREFIX}/alerts`,
  // POST: `${ENDPOINTS.alerts}/${alertId}/resolve`
  // POST: `${ENDPOINTS.alerts}/${alertId}/activate`
  alertsIntelligenceRun: `${API_PREFIX}/alerts/intelligence/run`,
  alertsIntelligenceSimulate: `${API_PREFIX}/alerts/intelligence/simulate`,
  publicSimulatorWeatherAlert: `${API_PREFIX}/public/simulator/weather-alert`,
  remindersRun: `${API_PREFIX}/reminders/run`,

  // ── Inventory ──────────────────────────────────────────────────────────────
  inventoryItems: `${API_PREFIX}/inventory/items`,
  // PUT: `${ENDPOINTS.inventoryItems}/${itemId}`
  // POST: `${ENDPOINTS.inventoryItems}/${itemId}/adjust`
  inventoryDistribute: `${API_PREFIX}/inventory/distribute`,

  // ── Allocation ─────────────────────────────────────────────────────────────
  allocationRecommend: `${API_PREFIX}/allocation/recommend`,
  allocationConfirm: `${API_PREFIX}/allocation/confirm`,
  allocationConflictCheck: `${API_PREFIX}/allocation/conflict-check`,
  resourceOptimization: `${API_PREFIX}/allocation/resource-optimization`,

  // ── Households & People ────────────────────────────────────────────────────
  households: `${API_PREFIX}/households`,
  people: `${API_PREFIX}/people`,

  // ── Uploads & OCR ──────────────────────────────────────────────────────────
  uploads: `${API_PREFIX}/uploads`,
  // GET: `${ENDPOINTS.uploads}/${uploadId}`
  // POST: `${ENDPOINTS.uploads}/${uploadId}/process`
  // POST: `${ENDPOINTS.uploads}/${uploadId}/review`

  // ── AI & NLP ───────────────────────────────────────────────────────────────
  aiExtractCase: `${API_PREFIX}/ai/extract-case`,
  aiSummarizeCase: `${API_PREFIX}/ai/summarize-case`,
  aiTranslate: `${API_PREFIX}/ai/translate`,
  aiReportSummary: `${API_PREFIX}/ai/generate-report-summary`,

  // ── Reports & Exports ─────────────────────────────────────────────────────
  dashboardSummary: `${API_PREFIX}/dashboard/summary`,
  reportsCases: `${API_PREFIX}/reports/cases`,
  reportsVolunteers: `${API_PREFIX}/reports/volunteers`,
  reportsInventory: `${API_PREFIX}/reports/inventory`,
  exportCasesCSV: `${API_PREFIX}/exports/cases.csv`,
  exportCasesPDF: `${API_PREFIX}/exports/cases.pdf`,

  // ── Admin ──────────────────────────────────────────────────────────────────
  adminAuditLogs: `${API_PREFIX}/admin/audit-logs`,
  adminForms: `${API_PREFIX}/admin/forms`,
  adminSettings: `${API_PREFIX}/admin/settings`,
  adminUsers: `${API_PREFIX}/admin/users`,
} as const;
