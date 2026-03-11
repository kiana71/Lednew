/**
 * Application Routes Configuration
 *
 * All route-level views are code-split via React.lazy().
 * Each route wraps its lazy component in <Suspense> with a
 * section-specific skeleton fallback for instant visual feedback.
 */

import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { RootLayout } from './components/RootLayout';
import { LoginPage } from './components/auth/LoginPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import {
  DashboardSkeleton,
  DatabaseViewSkeleton,
  SettingsSkeleton,
  AdminSkeleton,
  StudioSkeleton,
} from './components/shared/skeletons';

/* ------------------------------------------------------------------ */
/*  Lazy-loaded route components                                       */
/* ------------------------------------------------------------------ */

const LazyDashboardView = React.lazy(() =>
  import('./components/dashboard/DashboardView').then((m) => ({ default: m.DashboardView })),
);

const LazyScreensView = React.lazy(() =>
  import('./components/screens/ScreensView').then((m) => ({ default: m.ScreensView })),
);

const LazyMountsView = React.lazy(() =>
  import('./components/mounts/MountsView').then((m) => ({ default: m.MountsView })),
);

const LazyMediaPlayersView = React.lazy(() =>
  import('./components/media-players/MediaPlayersView').then((m) => ({ default: m.MediaPlayersView })),
);

const LazyReceptacleBoxesView = React.lazy(() =>
  import('./components/receptacle-boxes/ReceptacleBoxesView').then((m) => ({ default: m.ReceptacleBoxesView })),
);

const LazyUserSettings = React.lazy(() =>
  import('./components/settings/UserSettings').then((m) => ({ default: m.UserSettings })),
);

const LazyAdminPanel = React.lazy(() =>
  import('./components/admin/AdminPanel').then((m) => ({ default: m.AdminPanel })),
);

const LazyAdminsPanel = React.lazy(() =>
  import('./components/admin/AdminsPanel').then((m) => ({ default: m.AdminsPanel })),
);

const LazyDrawingStudio = React.lazy(() =>
  import('./components/studio/DrawingStudio').then((m) => ({ default: m.DrawingStudio })),
);

/* ------------------------------------------------------------------ */
/*  Router definition                                                  */
/* ------------------------------------------------------------------ */

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: '/login',
        Component: LoginPage,
      },
      {
        path: '/reset-password',
        Component: ResetPasswordPage,
      },
      {
        element: (
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: '/dashboard',
            element: (
              <Suspense fallback={<DashboardSkeleton />}>
                <LazyDashboardView />
              </Suspense>
            ),
          },
          {
            path: '/settings',
            element: (
              <Suspense fallback={<SettingsSkeleton />}>
                <LazyUserSettings />
              </Suspense>
            ),
          },
          {
            path: '/admin/admins',
            element: (
              <Suspense fallback={<AdminSkeleton />}>
                <LazyAdminsPanel />
              </Suspense>
            ),
          },
          {
            path: '/admin/users',
            element: (
              <Suspense fallback={<AdminSkeleton />}>
                <LazyAdminPanel />
              </Suspense>
            ),
          },
          {
            path: '/database/screens',
            element: (
              <Suspense fallback={<DatabaseViewSkeleton />}>
                <LazyScreensView />
              </Suspense>
            ),
          },
          {
            path: '/database/mounts',
            element: (
              <Suspense fallback={<DatabaseViewSkeleton />}>
                <LazyMountsView />
              </Suspense>
            ),
          },
          {
            path: '/database/media-players',
            element: (
              <Suspense fallback={<DatabaseViewSkeleton />}>
                <LazyMediaPlayersView />
              </Suspense>
            ),
          },
          {
            path: '/database/receptacle-boxes',
            element: (
              <Suspense fallback={<DatabaseViewSkeleton />}>
                <LazyReceptacleBoxesView />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: '/studio',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<StudioSkeleton />}>
              <LazyDrawingStudio />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/studio/:id',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<StudioSkeleton />}>
              <LazyDrawingStudio />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);