export type HopeAidRole =
  | 'super_admin'
  | 'admin'
  | 'org_manager'
  | 'field_coordinator'
  | 'reviewer'
  | 'volunteer'
  | string;

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'DEVADMIN',
  admin: 'ORG_ADMIN',
  org_manager: 'ORG_MANAGER',
  field_coordinator: 'FIELD_COORDINATOR',
  reviewer: 'REVIEWER',
  volunteer: 'VOLUNTEER',
};

export const LOGIN_ROLE_OPTIONS = [
  { value: 'super_admin', label: 'DEVADMIN' },
  { value: 'admin', label: 'ORG_ADMIN' },
  { value: 'org_manager', label: 'ORG_MANAGER' },
  { value: 'volunteer', label: 'VOLUNTEER' },
] as const;

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'cases:view',
    'cases:create',
    'cases:update',
    'cases:approve',
    'cases:assign',
    'cases:close',
    'cases:delete',
    'volunteers:view',
    'volunteers:create',
    'volunteers:update',
    'orgs:view',
    'orgs:create',
    'orgs:update',
    'users:create_org_admin',
    'users:create_org_manager',
    'users:create_volunteer',
    'alerts:view',
    'alerts:create',
    'alerts:resolve',
    'inventory:view',
    'inventory:manage',
    'households:view',
    'households:manage',
    'reports:view',
    'admin:forms',
    'admin:audit_logs',
    'admin:settings',
  ],
  admin: [
    'cases:view',
    'cases:create',
    'cases:update',
    'cases:approve',
    'cases:assign',
    'cases:close',
    'cases:delete',
    'volunteers:view',
    'volunteers:create',
    'volunteers:update',
    'orgs:view',
    'users:create_org_manager',
    'users:create_volunteer',
    'alerts:view',
    'alerts:create',
    'alerts:resolve',
    'inventory:view',
    'inventory:manage',
    'households:view',
    'households:manage',
    'reports:view',
    'admin:forms',
    'admin:audit_logs',
    'admin:settings',
  ],
  org_manager: [
    'cases:view',
    'cases:create',
    'cases:update',
    'cases:approve',
    'cases:assign',
    'cases:close',
    'volunteers:view',
    'volunteers:create',
    'volunteers:update',
    'users:create_volunteer',
    'alerts:view',
    'alerts:create',
    'alerts:resolve',
    'inventory:view',
    'inventory:manage',
    'households:view',
    'households:manage',
    'reports:view',
    'admin:forms',
    'admin:audit_logs',
    'admin:settings',
  ],
  field_coordinator: [
    'cases:view',
    'cases:create',
    'cases:update',
    'cases:assign',
    'volunteers:view',
    'alerts:view',
    'alerts:create',
    'inventory:view',
    'inventory:manage',
    'households:view',
    'households:manage',
    'reports:view',
  ],
  reviewer: [
    'cases:view',
    'cases:approve',
    'cases:close',
    'alerts:view',
    'reports:view',
  ],
  volunteer: [
    'cases:view',
    'volunteers:view',
    'alerts:view',
    'households:view',
  ],
};

const ROUTE_PERMISSION_RULES: Array<{ pattern: RegExp; permission: string }> = [
  { pattern: /^\/(devadmin|org-admin|org-manager)\/cases(?:\/|$)/, permission: 'cases:view' },
  { pattern: /^\/(devadmin|org-admin|org-manager)\/volunteers(?:\/|$)/, permission: 'volunteers:view' },
  { pattern: /^\/(devadmin|org-admin|org-manager)\/inventory(?:\/|$)/, permission: 'inventory:view' },
  { pattern: /^\/(devadmin|org-admin|org-manager)\/alerts(?:\/|$)/, permission: 'alerts:view' },
  { pattern: /^\/(devadmin|org-admin|org-manager)\/households(?:\/|$)/, permission: 'households:view' },
  { pattern: /^\/(devadmin|org-admin|org-manager)\/organizations(?:\/|$)/, permission: 'orgs:view' },
  { pattern: /^\/(devadmin|org-admin|org-manager)\/reports(?:\/|$)/, permission: 'reports:view' },
  { pattern: /^\/(devadmin|org-admin|org-manager)\/audit-logs(?:\/|$)/, permission: 'admin:audit_logs' },
  { pattern: /^\/(devadmin|org-admin|org-manager)\/settings(?:\/|$)/, permission: 'admin:settings' },
  { pattern: /^\/volunteer(?:\/cases)?(?:\/|$)/, permission: 'cases:view' },
];

export function getRoleLabel(role?: HopeAidRole | null, fallback?: string | null) {
  if (fallback) return fallback;
  if (!role) return 'USER';
  return ROLE_LABELS[role] || role.toUpperCase();
}

export function isAdminRole(role?: HopeAidRole | null) {
  if (!role) return false;
  return role !== 'volunteer';
}

export function getPortalBasePath(role?: HopeAidRole | null) {
  switch (role) {
    case 'super_admin':
      return '/devadmin';
    case 'admin':
      return '/org-admin';
    case 'org_manager':
    case 'field_coordinator':
    case 'reviewer':
      return '/org-manager';
    default:
      return '/volunteer';
  }
}

export function hasPermission(permissions: string[] | undefined, permission: string) {
  return !!permissions?.includes(permission);
}

export function getRolePermissions(role?: HopeAidRole | null): string[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] || [];
}

export function resolvePermissions(permissions: string[] | undefined, role?: HopeAidRole | null): string[] {
  if (permissions && permissions.length > 0) return permissions;
  return getRolePermissions(role);
}

export function getRequiredPermissionForPath(pathname: string): string | null {
  for (const rule of ROUTE_PERMISSION_RULES) {
    if (rule.pattern.test(pathname)) {
      return rule.permission;
    }
  }
  return null;
}
