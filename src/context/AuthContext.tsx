'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { ENDPOINTS } from '@/config/api';
import {
  ApiError,
  apiFetch,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/lib/api-client';
import { cacheManager } from '@/lib/cache';
import { getDisplayEmail } from '@/lib/contact';
import { getRoleLabel } from '@/lib/rbac';

interface UserInfo {
  id: string;
  email: string | null;
  name: string;
  full_name: string;
  role: string;
  role_label?: string;
  permissions?: string[];
  organization_id: string | null;
  is_active: boolean;
  phone: string | null;
}

interface MeResponse {
  success: boolean;
  data: {
    user: UserInfo;
    organization_name: string | null;
    role_label?: string | null;
    permissions?: string[];
  };
}

interface TokenResponse {
  success: boolean;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in?: number;
  };
}

interface AuthContextValue {
  user: UserInfo | null;
  orgName: string | null;
  permissions: string[];
  roleLabel: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string, expectedRole?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function getUserFromToken(token: string): UserInfo | null {
  const payload = decodeJWT(token);
  if (!payload) return null;

  return {
    id: payload.sub as string,
    email: null,
    name: '',
    full_name: '',
    role: (payload.role as string) || 'volunteer',
    role_label: getRoleLabel((payload.role as string) || 'volunteer'),
    permissions: [],
    organization_id: (payload.org_id as string) || null,
    is_active: true,
    phone: null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(() => {
    const token = getAccessToken();
    return token ? getUserFromToken(token) : null;
  });
  const [orgName, setOrgName] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roleLabel, setRoleLabel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyUserFromJWT = useCallback((token: string) => {
    const nextUser = getUserFromToken(token);
    if (nextUser) {
      setUser(nextUser);
      setRoleLabel(nextUser.role_label || getRoleLabel(nextUser.role));
    }
  }, []);

  const resetAuthState = useCallback(() => {
    clearTokens();
    cacheManager.clearAll();
    setUser(null);
    setOrgName(null);
    setPermissions([]);
    setRoleLabel(null);
    setIsLoading(false);
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const res = await apiFetch<MeResponse>(ENDPOINTS.me);
      if (res.success && res.data) {
        const nextUser = res.data.user;
        setUser({
          ...nextUser,
          email: getDisplayEmail(nextUser.email),
          full_name: nextUser.name || nextUser.full_name || '',
          role_label: res.data.role_label || getRoleLabel(nextUser.role),
          permissions: res.data.permissions || [],
        });
        setOrgName(res.data.organization_name);
        setPermissions(res.data.permissions || []);
        setRoleLabel(res.data.role_label || getRoleLabel(nextUser.role));
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        resetAuthState();
        return;
      }

      throw error;
    }
  }, [resetAuthState]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      applyUserFromJWT(token);
      setIsLoading(false);
      void fetchMe().catch(() => undefined);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [applyUserFromJWT, fetchMe]);

  const login = async (identifier: string, password: string, expectedRole?: string) => {
    const res = await apiFetch<TokenResponse>(ENDPOINTS.login, {
      method: 'POST',
      body: { identifier, password },
      noAuth: true,
    });

    if (res.success && res.data) {
      const tokenUser = getUserFromToken(res.data.access_token);
      if (!tokenUser) {
        throw new Error('Invalid access token payload');
      }
      if (expectedRole && tokenUser.role !== expectedRole) {
        throw new Error(`Selected role does not match this account (${getRoleLabel(tokenUser.role)})`);
      }

      setTokens(res.data.access_token, res.data.refresh_token);
      setUser(tokenUser);
      setRoleLabel(tokenUser.role_label || getRoleLabel(tokenUser.role));
      setIsLoading(false);
      void fetchMe().catch(() => undefined);
    }
  };

  const logout = () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      void apiFetch(ENDPOINTS.logout, {
        method: 'POST',
        body: { refresh_token: refreshToken },
      }).catch(() => undefined);
    }

    resetAuthState();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        orgName,
        permissions,
        roleLabel,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser: fetchMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
