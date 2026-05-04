'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { apiFetch } from '@/lib/api-client';
import { getDisplayEmail } from '@/lib/contact';
import { ENDPOINTS } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Building2, User, Shield } from 'lucide-react';

interface AdminSettings {
  organization_id: string;
  name: string;
  slug: string;
  status: string;
  settings: Record<string, unknown>;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const displayEmail = getDisplayEmail(user?.email);

  useEffect(() => {
    apiFetch<{ success: boolean; data: AdminSettings }>(ENDPOINTS.adminSettings)
      .then((res) => setSettings(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1><p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Organization and account settings.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3"><User size={18} className="text-gray-400 dark:text-gray-500" /><div><p className="text-xs text-gray-500 dark:text-gray-400">Name</p><p className="font-medium dark:text-gray-100">{user?.full_name}</p></div></div>
            <div className="flex items-center gap-3"><span className="text-gray-400 text-sm dark:text-gray-500">@</span><div><p className="text-xs text-gray-500 dark:text-gray-400">Email</p><p className="font-medium dark:text-gray-100">{displayEmail || '-'}</p></div></div>
            <div className="flex items-center gap-3"><Shield size={18} className="text-gray-400 dark:text-gray-500" /><div><p className="text-xs text-gray-500 dark:text-gray-400">Role</p><p className="font-medium capitalize dark:text-gray-100">{user?.role?.replace(/_/g, ' ')}</p></div></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Organization</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {loading ? <Loader2 className="animate-spin text-blue-600" /> : settings ? (
              <>
                <div className="flex items-center gap-3"><Building2 size={18} className="text-gray-400 dark:text-gray-500" /><div><p className="text-xs text-gray-500 dark:text-gray-400">Name</p><p className="font-medium dark:text-gray-100">{settings.name}</p></div></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Slug</p><p className="font-mono text-sm dark:text-gray-100">{settings.slug}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Status</p><p className="font-medium capitalize dark:text-gray-100">{settings.status}</p></div>
              </>
            ) : <p className="text-sm text-gray-400 dark:text-gray-500">Unable to load settings.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
