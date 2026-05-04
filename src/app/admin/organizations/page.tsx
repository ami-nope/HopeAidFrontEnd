'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Loader2, Shield, User, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { ENDPOINTS } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api-client';
import { getPreferredContact } from '@/lib/contact';
import { getRoleLabel, hasPermission } from '@/lib/rbac';

interface OrgItem {
  id: string;
  name: string;
  slug: string;
  status: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
}

type InlineStatus = {
  tone: 'success' | 'error' | 'warning';
  message: string;
};

export default function OrganizationsPage() {
  const { user, orgName, roleLabel, permissions } = useAuth();
  const isDevAdmin = user?.role === 'super_admin';
  const contactLabel = getPreferredContact(user);

  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [orgMessage, setOrgMessage] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [userInlineStatus, setUserInlineStatus] = useState<InlineStatus | null>(null);
  const createOrgLockRef = useRef(false);
  const createUserLockRef = useRef(false);

  const [orgForm, setOrgForm] = useState({ name: '', slug: '' });
  const [userForm, setUserForm] = useState({
    organization_id: user?.organization_id || '',
    role: user?.role === 'super_admin' ? 'admin' : user?.role === 'admin' ? 'org_manager' : 'volunteer',
    name: '',
    identifier: '',
    password: '',
  });
  const canViewOrganizations = hasPermission(permissions, 'orgs:view');

  const roleOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = [];
    if (hasPermission(permissions, 'users:create_org_admin')) {
      options.push({ value: 'admin', label: 'ORG_ADMIN' });
    }
    if (hasPermission(permissions, 'users:create_org_manager')) {
      options.push({ value: 'org_manager', label: 'ORG_MANAGER' });
    }
    if (hasPermission(permissions, 'users:create_volunteer')) {
      options.push({ value: 'volunteer', label: 'VOLUNTEER' });
    }
    return options;
  }, [permissions]);

  const effectiveRole = roleOptions.some((opt) => opt.value === userForm.role)
    ? userForm.role
    : (roleOptions[0]?.value || 'volunteer');

  const loadOrgs = useCallback(async () => {
    if (!canViewOrganizations) {
      setOrgs([]);
      return;
    }

    setLoadingOrgs(true);
    try {
      const res = await apiFetch<PaginatedResponse<OrgItem>>(
        `${ENDPOINTS.orgs}?page=1&page_size=100`,
      );
      setOrgs(res.data || []);
      setUserForm((prev) => {
        if (!isDevAdmin || prev.organization_id || !res.data?.[0]?.id) {
          return prev;
        }
        return { ...prev, organization_id: res.data[0].id };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizations');
    } finally {
      setLoadingOrgs(false);
    }
  }, [canViewOrganizations, isDevAdmin]);

  useEffect(() => {
    if (!canViewOrganizations) return;

    const timeoutId = window.setTimeout(() => {
      void loadOrgs();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [canViewOrganizations, loadOrgs]);

  const handleCreateOrg = async () => {
    if (createOrgLockRef.current) {
      setWarning('Organization creation is already in progress.');
      return;
    }
    if (!orgForm.name.trim() || !orgForm.slug.trim()) {
      setError('Organization name and slug are required');
      return;
    }

    setWarning('');
    setError('');
    setOrgMessage('');
    setUserMessage('');
    setUserInlineStatus(null);
    createOrgLockRef.current = true;
    setCreatingOrg(true);

    try {
      await apiFetch(ENDPOINTS.orgs, {
        method: 'POST',
        body: {
          name: orgForm.name.trim(),
          slug: orgForm.slug.trim().toLowerCase(),
          status: 'active',
        },
      });
      setOrgMessage('Organization created');
      setOrgForm({ name: '', slug: '' });
      await loadOrgs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      createOrgLockRef.current = false;
      setCreatingOrg(false);
    }
  };

  const handleCreateUser = async () => {
    if (createUserLockRef.current) {
      const message = 'Account creation is already in progress. Please wait.';
      setWarning(message);
      setUserInlineStatus({ tone: 'warning', message });
      return;
    }
    if (!roleOptions.length) {
      const message = 'Your role does not have permission to create accounts.';
      setWarning(message);
      setUserInlineStatus({ tone: 'warning', message });
      return;
    }
    if (!userForm.identifier.trim()) {
      const message = 'Email or phone is required.';
      setError(message);
      setUserInlineStatus({ tone: 'error', message });
      return;
    }
    if (!userForm.password.trim()) {
      const message = 'Password is required.';
      setError(message);
      setUserInlineStatus({ tone: 'error', message });
      return;
    }
    if (userForm.password.length < 8) {
      const message = 'Password must be at least 8 characters.';
      setError(message);
      setUserInlineStatus({ tone: 'error', message });
      return;
    }
    if (!/[A-Z]/.test(userForm.password)) {
      const message = 'Password must include at least one uppercase letter.';
      setError(message);
      setUserInlineStatus({ tone: 'error', message });
      return;
    }
    if (!/\d/.test(userForm.password)) {
      const message = 'Password must include at least one number.';
      setError(message);
      setUserInlineStatus({ tone: 'error', message });
      return;
    }
    if (isDevAdmin && !userForm.organization_id) {
      const message = 'Select an organization.';
      setError(message);
      setUserInlineStatus({ tone: 'error', message });
      return;
    }

    setWarning('');
    setError('');
    setOrgMessage('');
    setUserMessage('');
    setUserInlineStatus(null);
    createUserLockRef.current = true;
    setCreatingUser(true);

    const payload: Record<string, unknown> = {
      role: effectiveRole,
      identifier: userForm.identifier.trim(),
      password: userForm.password.trim(),
      create_volunteer_profile: effectiveRole === 'volunteer',
    };

    if (userForm.name.trim()) {
      payload.name = userForm.name.trim();
    }

    if (isDevAdmin) {
      payload.organization_id = userForm.organization_id;
    }

    try {
      await apiFetch(ENDPOINTS.adminUsers, { method: 'POST', body: payload });
      const message = `${getRoleLabel(effectiveRole)} account created successfully.`;
      setUserMessage(message);
      setUserInlineStatus({ tone: 'success', message });
      setUserForm((prev) => ({ ...prev, name: '', identifier: '', password: '' }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      setError(message);
      setUserInlineStatus({ tone: 'error', message });
    } finally {
      createUserLockRef.current = false;
      setCreatingUser(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Organization Control</h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
          Manage organization scope and role-based user access.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      )}
      {warning && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
          {warning}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Building2 size={18} className="text-gray-400 dark:text-gray-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Organization</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{orgName || 'Platform Scope'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User size={18} className="text-gray-400 dark:text-gray-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Logged in as</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{user?.full_name || contactLabel || 'User'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-gray-400 dark:text-gray-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{roleLabel || getRoleLabel(user?.role)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isDevAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Create Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orgMessage && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{orgMessage}</p>
            )}
            <InputField
              label="Organization Name"
              value={orgForm.name}
              disabled={creatingOrg}
              onChange={(e) => setOrgForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="HopeAid Chennai"
            />
            <InputField
              label="Slug"
              value={orgForm.slug}
              disabled={creatingOrg}
              onChange={(e) => setOrgForm((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="hopeaid-chennai"
            />
            <Button onClick={handleCreateOrg} disabled={creatingOrg} className="gap-2">
              {creatingOrg && <Loader2 size={15} className="animate-spin" />}
              {creatingOrg ? 'Creating...' : 'Create Organization'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create Role Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!roleOptions.length && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your role does not have permission to create additional accounts.
            </p>
          )}
          {userMessage && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{userMessage}</p>
          )}
          {roleOptions.length > 0 && (
            <>
              {isDevAdmin && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Organization</label>
                  <select
                    value={userForm.organization_id}
                    disabled={creatingUser}
                    onChange={(e) => setUserForm((prev) => ({ ...prev, organization_id: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select organization</option>
                    {orgs.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <select
                  value={effectiveRole}
                  disabled={creatingUser}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <InputField
                label="Name (optional for ORG_ADMIN)"
                value={userForm.name}
                disabled={creatingUser}
                onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="If empty for ORG_ADMIN, backend auto-uses ORGNAME-ADMIN"
              />
              <InputField
                label="Email / Phone"
                type="text"
                value={userForm.identifier}
                disabled={creatingUser}
                onChange={(e) => setUserForm((prev) => ({ ...prev, identifier: e.target.value }))}
                placeholder="manager@org.com or +91XXXXXXXXXX"
              />
              <InputField
                label="Password"
                type="password"
                value={userForm.password}
                disabled={creatingUser}
                onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Strong password"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Password rules: at least 8 characters, 1 uppercase letter, and 1 number.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleCreateUser} className="gap-2" disabled={creatingUser || !roleOptions.length}>
                  {creatingUser ? <Loader2 size={15} className="animate-spin" /> : <Users size={15} />}
                  {creatingUser ? 'Creating...' : 'Create Account'}
                </Button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {creatingUser
                    ? 'Request in progress...'
                    : loadingOrgs
                      ? 'Loading organizations...'
                      : `${orgs.length} organization(s) available`}
                </span>
              </div>
              {userInlineStatus && (
                <p
                  className={`text-sm ${
                    userInlineStatus.tone === 'success'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : userInlineStatus.tone === 'warning'
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {userInlineStatus.message}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
