/**
 * Sidebar Navigation Component
 *
 * Main navigation sidebar for the dashboard with database sections.
 * Hover-based prefetching warms lazy-loaded route chunks before click.
 */

import React, { useCallback } from 'react';
import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Monitor,
  Settings,
  Tv,
  Zap,
  Database,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../ui/utils';
import signcastLogo from '../../../assets/bc8c925efd893fdcdf90dd4b45e6de9600299d46.png';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  section?: 'main' | 'database' | 'system';
}

const navItems: NavItem[] = [
  {
    label: 'Drawings',
    icon: <LayoutDashboard className="size-5" />,
    path: '/dashboard',
    section: 'main',
  },
  {
    label: 'Screens',
    icon: <Monitor className="size-5" />,
    path: '/database/screens',
    section: 'database',
  },
  {
    label: 'Mounts',
    icon: <Settings className="size-5" />,
    path: '/database/mounts',
    section: 'database',
  },
  {
    label: 'Media Players',
    icon: <Tv className="size-5" />,
    path: '/database/media-players',
    section: 'database',
  },
  {
    label: 'Receptacle Boxes',
    icon: <Zap className="size-5" />,
    path: '/database/receptacle-boxes',
    section: 'database',
  },
  {
    label: 'Admins',
    icon: <ShieldCheck className="size-5" />,
    path: '/admin/admins',
    section: 'system',
  },
  {
    label: 'Users',
    icon: <Users className="size-5" />,
    path: '/admin/users',
    section: 'system',
  },
];

/* ------------------------------------------------------------------ */
/*  Route → lazy chunk prefetch map                                    */
/* ------------------------------------------------------------------ */

const prefetchMap: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('../dashboard/DashboardView'),
  '/database/screens': () => import('../screens/ScreensView'),
  '/database/mounts': () => import('../mounts/MountsView'),
  '/database/media-players': () => import('../media-players/MediaPlayersView'),
  '/database/receptacle-boxes': () => import('../receptacle-boxes/ReceptacleBoxesView'),
  '/settings': () => import('../settings/UserSettings'),
  '/admin/admins': () => import('../admin/AdminsPanel'),
  '/admin/users': () => import('../admin/AdminPanel'),
};

export function Sidebar() {
  const location = useLocation();

  /** Fire-and-forget: start loading the chunk on hover */
  const handlePrefetch = useCallback((path: string) => {
    const loader = prefetchMap[path];
    if (loader) loader();
  }, []);

  // Sidebar is only rendered for superadmin (see MainLayout), so no role checks needed
  const mainItems = navItems.filter((item) => item.section === 'main');
  const databaseItems = navItems.filter((item) => item.section === 'database');
  const systemItems = navItems.filter((item) => item.section === 'system');

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-full flex flex-col overflow-y-auto">
      {/* Logo/Brand */}
      <div className="px-5 py-5">
        <img
          src={signcastLogo}
          alt="SignCast Media"
          className="h-10 w-auto object-contain"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          {mainItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100',
                )}
                onMouseEnter={() => handlePrefetch(item.path)}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Database Section */}
        {databaseItems.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-4 py-2">
              <Database className="size-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Inventory
              </span>
            </div>
            {databaseItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100',
                  )}
                  onMouseEnter={() => handlePrefetch(item.path)}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* System Section */}
        {systemItems.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-4 py-2">
              <Settings className="size-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                System
              </span>
            </div>
            {systemItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100',
                  )}
                  onMouseEnter={() => handlePrefetch(item.path)}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </aside>
  );
}