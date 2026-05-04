'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { DashboardLayout } from '@/components/DashboardLayout';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { getPortalBasePath, getRequiredPermissionForPath, hasPermission, resolvePermissions } from '@/lib/rbac';
import { ThemeProvider } from '@/components/ThemeProvider';

const PUBLIC_PATHS = ['/', '/login', '/simulator'];
const REDIRECT_IF_AUTHENTICATED_PUBLIC_PATHS = ['/', '/login'];
const ORG_MANAGER_ROLES = ['org_manager', 'field_coordinator', 'reviewer'];

function hasPortalAccess(pathname: string, role: string) {
  if (pathname.includes('/organizations')) return role === 'super_admin' || role === 'admin';
  if (pathname.startsWith('/devadmin')) return role === 'super_admin';
  if (pathname.startsWith('/org-admin')) return role === 'admin';
  if (pathname.startsWith('/org-manager')) return ORG_MANAGER_ROLES.includes(role);
  if (pathname.startsWith('/volunteer')) return role === 'volunteer';
  return true;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, permissions } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const shouldBlockForAuth = isLoading && !isPublic;
  const shouldRedirectAuthenticatedFromPublic = REDIRECT_IF_AUTHENTICATED_PUBLIC_PATHS.includes(pathname);
  const dashboardPath = getPortalBasePath(user?.role);
  const effectivePermissions = resolvePermissions(permissions, user?.role);
  const requiredPermission = getRequiredPermissionForPath(pathname);

  let redirectTarget: string | null = null;
  if (!isLoading) {
    if (!isPublic && !isAuthenticated) {
      redirectTarget = '/';
    } else if (isPublic && shouldRedirectAuthenticatedFromPublic && isAuthenticated && user) {
      redirectTarget = dashboardPath;
    } else if (isAuthenticated && user && !hasPortalAccess(pathname, user.role)) {
      redirectTarget = dashboardPath;
    } else if (
      isAuthenticated &&
      user &&
      requiredPermission &&
      !hasPermission(effectivePermissions, requiredPermission)
    ) {
      redirectTarget = dashboardPath;
    } else if (isAuthenticated && user && pathname.startsWith('/admin')) {
      const suffix = pathname === '/admin' ? '' : pathname.slice('/admin'.length);
      redirectTarget = `${dashboardPath}${suffix}`;
    }
  }

  useEffect(() => {
    if (redirectTarget && redirectTarget !== pathname) {
      router.replace(redirectTarget);
    }
  }, [pathname, redirectTarget, router]);

  if (shouldBlockForAuth || redirectTarget) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600 dark:text-blue-500" />
          <span className="text-sm text-gray-500 dark:text-gray-300">Loading...</span>
        </div>
      </div>
    );
  }

  if (isPublic) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate>{children}</AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}
