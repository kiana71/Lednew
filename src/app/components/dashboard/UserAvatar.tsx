/**
 * User Avatar Component
 *
 * Renders a deterministic-color circle with the user's initials.
 * Provides a consistent, recognisable identity marker across
 * grid cards and list items without needing actual profile images.
 */

import React from 'react';

interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md';
}

const PALETTE = [
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  { bg: 'bg-orange-100', text: 'text-orange-700' },
  { bg: 'bg-teal-100', text: 'text-teal-700' },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function UserAvatar({ name, size = 'sm' }: UserAvatarProps) {
  const color = PALETTE[hashName(name) % PALETTE.length];
  const initials = getInitials(name);

  const sizeClasses = size === 'sm'
    ? 'size-6 text-[10px]'
    : 'size-8 text-xs';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full flex-shrink-0 font-medium select-none ${sizeClasses} ${color.bg} ${color.text}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
