const PHONE_PLACEHOLDER_SUFFIX = '@phone.hopeaid.local';

export function isPhonePlaceholderEmail(email?: string | null) {
  if (!email) return false;

  const normalized = email.trim().toLowerCase();
  return normalized.startsWith('phone_') && normalized.endsWith(PHONE_PLACEHOLDER_SUFFIX);
}

export function getDisplayEmail(email?: string | null) {
  if (!email || isPhonePlaceholderEmail(email)) return null;
  return email;
}

export function getPreferredContact(contact?: { email?: string | null; phone?: string | null } | null) {
  return getDisplayEmail(contact?.email) || contact?.phone || null;
}
