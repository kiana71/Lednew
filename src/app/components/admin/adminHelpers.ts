/**
 * Admin Helper Utilities
 *
 * Shared across admin sub-components for consistent
 * role badge variants, labels, and avatar initials.
 */

import { User } from '../../types';

export function getRoleBadgeVariant(role: User['role']) {
  switch (role) {
    case 'superadmin': return 'destructive' as const;
    case 'technician': return 'default' as const;
    case 'viewer': return 'outline' as const;
    default: return 'secondary' as const;
  }
}

export function getRoleLabel(role: User['role']) {
  switch (role) {
    case 'superadmin': return 'Super Admin';
    case 'technician': return 'Technician';
    case 'viewer': return 'Viewer';
    default: return role;
  }
}

export function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}
