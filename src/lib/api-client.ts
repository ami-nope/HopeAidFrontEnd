/**
 * Centralised fetch wrapper that automatically injects the JWT Bearer token
 * and handles token refresh + JSON parsing.
 */

import { API_BASE_URL, ENDPOINTS } from '@/config/api';

// ─── Token helpers ──────────────────────────────────────────────────────────
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hopeaid_access_token');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hopeaid_refresh_token');
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('hopeaid_access_token', access);
  localStorage.setItem('hopeaid_refresh_token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('hopeaid_access_token');
  localStorage.removeItem('hopeaid_refresh_token');
}

// ─── Core fetch ─────────────────────────────────────────────────────────────

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** If true, skip the Authorization header (e.g. for login) */
  noAuth?: boolean;
}

function parseErrorMessage(errorBody: unknown, status: number, statusText: string): string {
  if (typeof errorBody === 'string' && errorBody.trim()) return errorBody;
  if (!errorBody || typeof errorBody !== 'object') {
    return statusText || `Request failed (${status})`;
  }

  const payload = errorBody as Record<string, unknown>;
  const formatValidationItems = (items: unknown[]) => {
    const formatted = items
      .map((item) => {
        if (!item || typeof item !== 'object') return String(item);
        const err = item as Record<string, unknown>;
        const msg = typeof err.msg === 'string' ? err.msg : 'Validation error';
        const loc = Array.isArray(err.loc) ? err.loc.join('.') : '';
        return loc ? `${loc}: ${msg}` : msg;
      })
      .filter(Boolean)
      .join(' | ');
    return formatted || null;
  };

  const detail = payload.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const formattedDetail = formatValidationItems(detail);
    if (formattedDetail) return formattedDetail;
  }

  const details = payload.details;
  if (Array.isArray(details) && details.length > 0) {
    const formattedDetails = formatValidationItems(details);
    if (formattedDetails) return formattedDetails;
  }

  const error = payload.error;
  if (typeof error === 'string' && error.trim()) return error;
  return statusText || `Request failed (${status})`;
}

/**
 * Makes a request to `API_BASE_URL + path`.
 * Automatically adds `Authorization: Bearer <token>` unless `noAuth` is set.
 * If a 401 is returned, attempts a single token refresh before retrying.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { body, noAuth, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  };

  if (!noAuth) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed';
    throw new ApiError(0, message);
  }

  // On 401, try refreshing the token once
  if (response.status === 401 && !noAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`;
      try {
        response = await fetch(url, {
          ...rest,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Network request failed';
        throw new ApiError(0, message);
      }
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      parseErrorMessage(errorBody, response.status, response.statusText),
    );
  }

  return response.json() as Promise<T>;
}

// ─── Token refresh ──────────────────────────────────────────────────────────
let refreshPromise: Promise<boolean> | null = null;

export async function refreshAccessToken(): Promise<boolean> {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE_URL}${ENDPOINTS.refresh}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        clearTokens();
        return false;
      }

      const data = await res.json();
      if (data.success && data.data) {
        setTokens(data.data.access_token, data.data.refresh_token);
        return true;
      }
      clearTokens();
      return false;
    } catch {
      clearTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Error class ────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
