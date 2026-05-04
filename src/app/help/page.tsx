'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Bell,
  FileText,
  FolderKanban,
  Settings,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { getPortalBasePath, isAdminRole } from '@/lib/rbac';

const adminLinks = (basePath: string) => [
  {
    title: 'Review Cases',
    description: 'Open the cases table, search by title or case number, and update workflow status.',
    href: `${basePath}/cases`,
    icon: FolderKanban,
  },
  {
    title: 'Monitor Alerts',
    description: 'Check live alerts and resolve them once the issue is handled.',
    href: `${basePath}/alerts`,
    icon: Bell,
  },
  {
    title: 'Export Reports',
    description: 'Download CSV and PDF exports from the reports page.',
    href: `${basePath}/reports`,
    icon: FileText,
  },
  {
    title: 'Manage Settings',
    description: 'Review organization details and account information.',
    href: `${basePath}/settings`,
    icon: Settings,
  },
];

const volunteerLinks = [
  {
    title: 'Browse Cases',
    description: 'Search and review the cases that are visible to your organization role.',
    href: '/volunteer/cases',
    icon: FolderKanban,
  },
  {
    title: 'Open Alerts',
    description: 'Jump to the alert panel from the dashboard header bell icon.',
    href: '/volunteer#alerts',
    icon: Bell,
  },
  {
    title: 'View Profile',
    description: 'Check your account details and any linked volunteer record.',
    href: '/volunteer/profile',
    icon: UserCircle2,
  },
];

export default function HelpPage() {
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);
  const quickLinks = isAdmin ? adminLinks(getPortalBasePath(user?.role)) : volunteerLinks;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-8 text-white shadow-lg shadow-blue-950/10 dark:border-blue-900/60 dark:shadow-none">
        <div className="mb-6 inline-flex">
          <img 
            src="/images/hopeaid-logo-final-dark.png" 
            alt="HopeAid Logo" 
            className="h-16 w-auto object-contain drop-shadow-md" 
            loading="eager" 
          />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">HopeAid Guide</h1>
        <p className="mt-3 max-w-2xl text-sm text-blue-50">
          Use the search bar in the top navigation to jump straight to matching cases. The bell
          icon opens alerts, and the sidebar guide button brings you back here any time.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {quickLinks.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <item.icon size={20} />
                </div>
                <CardTitle>{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-gray-300">{item.description}</p>
              <Link
                href={item.href}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Open
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Volunteer Assignment View</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600 dark:text-gray-300">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 text-blue-600" />
            <p>
              Volunteers now have a dedicated &quot;My Assigned Cases&quot; section on the cases page,
              with organization-visible cases shown below it for broader context.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
