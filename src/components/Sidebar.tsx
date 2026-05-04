'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Building2,
  Settings,
  Package,
  AlertTriangle,
  ClipboardList,
  Home,
  ShieldCheck,
  FileText,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { getPortalBasePath, getRoleLabel, hasPermission, isAdminRole, resolvePermissions } from '@/lib/rbac';

interface NavItem {
  name: string;
  suffix: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  permission?: string;
  roles?: string[];
}

const adminNavTemplate: NavItem[] = [
  { name: 'Dashboard', suffix: '', icon: LayoutDashboard },
  { name: 'Cases', suffix: '/cases', icon: FolderKanban, permission: 'cases:view' },
  { name: 'Volunteers', suffix: '/volunteers', icon: Users, permission: 'volunteers:view' },
  { name: 'Inventory', suffix: '/inventory', icon: Package, permission: 'inventory:view' },
  { name: 'Alerts', suffix: '/alerts', icon: AlertTriangle, permission: 'alerts:view' },
  { name: 'Households', suffix: '/households', icon: Home, permission: 'households:view' },
  { name: 'Organizations', suffix: '/organizations', icon: Building2, permission: 'orgs:view', roles: ['super_admin', 'admin'] },
  { name: 'Reports', suffix: '/reports', icon: FileText, permission: 'reports:view' },
  { name: 'Audit Logs', suffix: '/audit-logs', icon: ClipboardList, permission: 'admin:audit_logs' },
  { name: 'Settings', suffix: '/settings', icon: Settings, permission: 'admin:settings' },
];

const volunteerNav = [
  { name: 'My Dashboard', href: '/volunteer', icon: LayoutDashboard },
  { name: 'Cases', href: '/volunteer/cases', icon: FolderKanban },
  { name: 'My Profile', href: '/volunteer/profile', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, roleLabel, permissions } = useAuth();

  const basePath = getPortalBasePath(user?.role);
  const isAdmin = isAdminRole(user?.role);
  const effectivePermissions = resolvePermissions(permissions, user?.role);
  const adminNav = adminNavTemplate
    .filter((item) => {
      if (item.roles && (!user?.role || !item.roles.includes(user.role))) {
        return false;
      }
      return !item.permission || hasPermission(effectivePermissions, item.permission);
    })
    .map((item) => ({ ...item, href: `${basePath}${item.suffix}` }));
  const navigation = isAdmin ? adminNav : volunteerNav;

  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white/95 transition-colors dark:border-gray-800 dark:bg-[#0a0a0a]">
      <div className="flex h-24 items-center justify-center border-b border-slate-200/80 px-4 dark:border-gray-800">
        <Link href={basePath} className="flex items-center justify-center w-full">
            <img src="/images/hopeaid-logo-final-light.png" alt="HopeAid Logo" className="h-16 w-auto object-contain transition-all hover:scale-105 dark:hidden" loading="eager" />
            <img src="/images/hopeaid-logo-final-dark.png" alt="HopeAid Logo" className="h-16 w-auto object-contain transition-all hover:scale-105 hidden dark:block" loading="eager" />
        </Link>
      </div>

      <div className="px-6 pt-4 pb-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-900">
          <ShieldCheck size={13} className="text-blue-600 dark:text-blue-400" />
          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
            {getRoleLabel(user?.role, roleLabel)}
          </span>
        </div>
      </div>

      <div className="flex-1 py-3 px-3 flex flex-col gap-0.5 overflow-y-auto">
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-400">
          {isAdmin ? 'Portal Menu' : 'Volunteer Menu'}
        </div>
        {navigation.map((item, index) => {
          const isActive = pathname === item.href || (item.href !== basePath && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group overflow-hidden ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10 ${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-800/30'
                  : 'bg-slate-200/30 dark:bg-gray-700/30'
              }`} />

              <item.icon size={18} className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-gray-400'}`} />

              <span className="relative overflow-hidden">
                {item.name}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" style={{ animation: 'slideInRight 0.3s ease-out' }} />
                )}
              </span>

              {isActive && (
                <div className="absolute right-2 h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="border-t border-slate-200/80 p-4 dark:border-gray-800">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100/50 dark:from-blue-900/10 dark:to-indigo-900/10 dark:border-blue-800/50">
          <h4 className="text-sm font-semibold text-blue-900 mb-1 dark:text-blue-300">Need help?</h4>
          <p className="text-xs text-blue-700 mb-3 dark:text-blue-400">Open the in-app guide for dashboard shortcuts and workflows.</p>
          <Link
            href="/help"
            className="inline-flex w-full items-center justify-center rounded-lg border border-blue-200 bg-white py-2 text-xs font-medium text-blue-600 shadow-sm transition-colors hover:bg-blue-50 dark:border-blue-800 dark:bg-[#0a0a0a] dark:text-blue-400 dark:hover:bg-blue-900/30"
          >
            Open Guide
          </Link>
        </div>
      </div>
    </div>
  );
}
