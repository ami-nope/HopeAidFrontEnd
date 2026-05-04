'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Building2,
  Settings,
  HeartPulse,
  Package,
  AlertTriangle,
  ClipboardList,
  Home,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const ADMIN_ROLES = ['super_admin', 'admin', 'org_manager', 'field_coordinator', 'reviewer'];

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Cases', href: '/admin/cases', icon: FolderKanban },
  { name: 'Volunteers', href: '/admin/volunteers', icon: Users },
  { name: 'Inventory', href: '/admin/inventory', icon: Package },
  { name: 'Alerts', href: '/admin/alerts', icon: AlertTriangle },
  { name: 'Households', href: '/admin/households', icon: Home },
  { name: 'Organizations', href: '/admin/organizations', icon: Building2 },
  { name: 'Reports', href: '/admin/reports', icon: FileText },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardList },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const volunteerNav = [
  { name: 'My Dashboard', href: '/volunteer', icon: LayoutDashboard },
  { name: 'Cases', href: '/volunteer/cases', icon: FolderKanban },
  { name: 'My Profile', href: '/volunteer/profile', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAdmin = user && ADMIN_ROLES.includes(user.role);
  const navigation = isAdmin ? adminNav : volunteerNav;

  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white/95 transition-colors dark:border-gray-800 dark:bg-[#0a0a0a]">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-200/80 px-6 dark:border-gray-800">
        <Link href={isAdmin ? '/admin' : '/volunteer'} className="flex items-center gap-2 text-blue-600 font-bold text-xl tracking-tight dark:text-blue-500">
          <HeartPulse size={28} className="text-blue-500" />
          HopeAid
        </Link>
      </div>

      {/* Role badge */}
      <div className="px-6 pt-4 pb-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-900">
          <ShieldCheck size={13} className="text-blue-600 dark:text-blue-400" />
          <span className="text-[11px] font-semibold text-blue-700 capitalize dark:text-blue-300">
            {user?.role?.replace(/_/g, ' ') || 'User'}
          </span>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex-1 py-3 px-3 flex flex-col gap-0.5 overflow-y-auto">
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-400">
          {isAdmin ? 'Admin Menu' : 'Volunteer Menu'}
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && item.href !== '/volunteer' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-gray-400'} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Help card */}
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
