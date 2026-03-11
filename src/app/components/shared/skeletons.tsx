/**
 * Section-Specific Skeleton Loaders
 *
 * Each skeleton mirrors the real view's layout structure so that
 * transitions between sections feel instant and jank-free.
 *
 * Used as Suspense fallbacks for React.lazy() route components.
 */

import React from 'react';
import { Skeleton } from '../ui/skeleton';

/* ------------------------------------------------------------------ */
/*  Primitive building blocks                                          */
/* ------------------------------------------------------------------ */

function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-20 mt-1" />
        </div>
        <Skeleton className="size-11 rounded-lg" />
      </div>
    </div>
  );
}

function SkeletonTableRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </td>
    </tr>
  );
}

function SkeletonTable({ cols, rows }: { cols: number; rows: number }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-64 rounded-md" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50/60">
        <div className="flex px-4 py-3 gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
          <div className="ml-auto">
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
      </div>
      {/* Rows */}
      <div className="flex-1 overflow-hidden">
        <table className="w-full">
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <SkeletonTableRow key={i} cols={cols} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard skeleton (drawings grid)                                 */
/* ------------------------------------------------------------------ */

function SkeletonDrawingCard() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="h-full overflow-hidden bg-slate-50 animate-in fade-in duration-150">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
        </div>

        {/* Search bar */}
        <Skeleton className="h-10 w-full rounded-md" />

        {/* Drawing card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonDrawingCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inventory / Database view skeleton (stats + table)                 */
/* ------------------------------------------------------------------ */

export function DatabaseViewSkeleton() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 animate-in fade-in duration-150">
      <div className="flex-1 flex flex-col min-h-0 max-w-7xl w-full mx-auto px-6 py-8 gap-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>

        {/* Table */}
        <SkeletonTable cols={5} rows={10} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings skeleton (profile card + tabbed form)                     */
/* ------------------------------------------------------------------ */

export function SettingsSkeleton() {
  return (
    <div className="h-full overflow-y-auto bg-slate-50 animate-in fade-in duration-150">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Page header */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* Profile overview card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-5">
            <Skeleton className="size-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-4">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>

          {/* Form card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200 space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="p-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-9 w-16 rounded-md" />
                <Skeleton className="h-9 w-32 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin panel skeleton (stat row + user table)                       */
/* ------------------------------------------------------------------ */

export function AdminSkeleton() {
  return (
    <div className="h-full overflow-y-auto bg-slate-50 animate-in fade-in duration-150">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-10" />
                </div>
                <Skeleton className="size-10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* User table card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-52" />
              </div>
            </div>
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="p-6">
            <div className="border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="bg-slate-50/60 border-b px-4 py-3 flex gap-8">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
                <div className="ml-auto"><Skeleton className="h-4 w-16" /></div>
              </div>
              {/* Rows */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-8 border-b border-slate-100 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                  <div className="ml-auto flex gap-1">
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Studio skeleton (full-screen canvas)                               */
/* ------------------------------------------------------------------ */

export function StudioSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-white animate-in fade-in duration-150">
      {/* Top toolbar */}
      <div className="h-12 border-b border-slate-200 flex items-center px-4 gap-3">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-4 w-32" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
      {/* Canvas area */}
      <div className="flex-1 flex">
        {/* Left panel */}
        <div className="w-56 border-r border-slate-200 p-3 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
        {/* Canvas */}
        <div className="flex-1 bg-slate-50 flex items-center justify-center">
          <Skeleton className="w-[60%] h-[70%] rounded-lg" />
        </div>
        {/* Right panel */}
        <div className="w-60 border-l border-slate-200 p-3 space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
