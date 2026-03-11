/**
 * Main Layout Component
 *
 * Wraps the main application with sidebar navigation.
 * Viewers get a sidebar-free layout — only the top bar and content.
 * The <Outlet /> content is rendered by Suspense boundaries
 * defined in routes.tsx — each route shows its own skeleton
 * while the lazy chunk loads, then fades in the real view.
 */

import React from 'react';
import { Outlet, useLocation } from 'react-router';
import { Sidebar } from './Sidebar';
import { UserProfileBar } from './UserProfileBar';
import { useAuth } from '../../contexts/AuthContext';

export function MainLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {isSuperadmin && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0">
        <UserProfileBar />
        <main className="flex-1 min-h-0">
          {/* key forces React to remount Suspense on route change,
              which triggers the skeleton → content transition */}
          <div key={location.pathname} className="h-full animate-in fade-in duration-200">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
