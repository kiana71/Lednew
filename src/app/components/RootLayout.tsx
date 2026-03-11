/**
 * Root Layout Component
 * 
 * Top-level layout rendered by the router.
 * Wraps the entire route tree with AuthProvider so that every
 * route component (including ProtectedRoute) has access to auth context.
 */

import { Outlet } from 'react-router';
import { AuthProvider } from '../contexts/AuthContext';
import { Toaster } from './ui/sonner';

export function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster position="top-center" />
    </AuthProvider>
  );
}