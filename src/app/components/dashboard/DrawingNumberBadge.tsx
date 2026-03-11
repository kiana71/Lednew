/**
 * Drawing Number Badge Component
 * 
 * Displays the sequential drawing number (SC-9000+) as a distinctive
 * monospace badge for quick visual identification.
 */

import React from 'react';
import { Hash } from 'lucide-react';

interface DrawingNumberBadgeProps {
  drawingNumber: string;
  /** "default" = icon + full badge, "compact" = inline without icon, "inline" = minimal for inline text */
  variant?: 'default' | 'compact' | 'inline';
}

export function DrawingNumberBadge({
  drawingNumber,
  variant = 'default',
}: DrawingNumberBadgeProps) {
  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-sm bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
        {drawingNumber}
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md tracking-wide">
        <Hash className="size-3 text-slate-400 flex-shrink-0" />
        {drawingNumber}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs bg-slate-900 text-slate-100 px-2.5 py-1 rounded-md tracking-wide">
      <Hash className="size-3 text-slate-400 flex-shrink-0" />
      {drawingNumber}
    </span>
  );
}
