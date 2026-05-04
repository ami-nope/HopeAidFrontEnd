'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bell, LogOut, Search, User } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { getPreferredContact } from '@/lib/contact';
import { getPortalBasePath, hasPermission, isAdminRole, resolvePermissions } from '@/lib/rbac';

import { InputField } from './ui/InputField';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const { user, orgName, logout, permissions } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const basePath = getPortalBasePath(user?.role);
  const isAdmin = isAdminRole(user?.role);
  const effectivePermissions = resolvePermissions(permissions, user?.role);
  const casesPath = isAdmin ? `${basePath}/cases` : '/volunteer/cases';
  const alertsPath = isAdmin ? `${basePath}/alerts` : '/volunteer#alerts';
  const canViewCases = hasPermission(effectivePermissions, 'cases:view');
  const canViewAlerts = hasPermission(effectivePermissions, 'alerts:view');
  const contactLabel = getPreferredContact(user);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const query = String(formData.get('q') || '').trim();
    const target = query ? `${casesPath}?q=${encodeURIComponent(query)}` : casesPath;

    if (target !== `${pathname}${window.location.search}`) {
      router.push(target);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 backdrop-blur transition-colors dark:border-gray-800 dark:bg-[#0a0a0a]/90">
      <div className="flex flex-1 items-center">
        {canViewCases && (
          <form onSubmit={handleSearch} className="w-full max-w-md">
            <InputField
              key={`${pathname}-${searchParams.get('q') ?? ''}`}
              name="q"
              defaultValue={searchParams.get('q') ?? ''}
              placeholder="Search cases by title or case #"
              icon={<Search size={18} className="text-slate-400 dark:text-gray-400" />}
              className="border-slate-200 bg-slate-50/90 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 focus:dark:border-blue-500 focus:dark:ring-blue-500/20"
            />
          </form>
        )}
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        {canViewAlerts && (
          <button
            type="button"
            onClick={() => router.push(alertsPath)}
            title="View alerts"
            className="relative rounded-full p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 hover:scale-110 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <Bell size={20} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500 animation-pulse dark:border-gray-900"></span>
          </button>
        )}

        <div className="mx-1 h-8 w-px bg-slate-200 dark:bg-gray-700"></div>

        <div className="flex items-center gap-3 pl-2">
          <div className="hidden flex-col text-right sm:flex">
            <span className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">
              {user?.full_name || 'User'}
            </span>
            <span className="mt-1 text-xs text-gray-500 dark:text-gray-300">
              {orgName || contactLabel || ''}
            </span>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-100 text-blue-600 shadow-sm dark:border-blue-900 dark:bg-blue-900/30 dark:text-blue-400">
            <User size={18} />
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            className="rounded-full p-2 text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500 hover:scale-110 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
