/**
 * Widget Card Component
 *
 * Compact stat card used on the dashboard to display a single metric
 * (e.g. total drawings, inventory counts).
 */

import React from 'react';

interface WidgetCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading?: boolean;
  accentColor: string;
  className?: string;
}

export function WidgetCard({
  icon,
  label,
  value,
  loading,
  accentColor,
  className = '',
}: WidgetCardProps) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-4 shadow-sm ${className}`}
    >
      <div
        className={`flex items-center justify-center size-10 rounded-lg text-white flex-shrink-0 ${accentColor}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-6 w-10 bg-slate-200 rounded mb-1" />
            <div className="h-3.5 w-16 bg-slate-100 rounded" />
          </div>
        ) : (
          <>
            <p className="text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground truncate">{label}</p>
          </>
        )}
      </div>
    </div>
  );
}
