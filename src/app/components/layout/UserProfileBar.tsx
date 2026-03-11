/**
 * User Profile Bar Component
 * 
 * Top bar with breadcrumb navigation and user menu
 */

import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Settings, LogOut, ChevronDown, Building2 } from 'lucide-react';
import { toast } from 'sonner';

// Route-to-label mapping for breadcrumbs
const routeLabels: Record<string, { label: string; parent?: { label: string; path: string } }> = {
  '/dashboard': { label: 'Drawings' },
  '/settings': { label: 'Settings' },
  '/admin': { label: 'User Management' },
  '/database/screens': { label: 'Screens', parent: { label: 'Inventory', path: '/dashboard' } },
  '/database/mounts': { label: 'Mounts', parent: { label: 'Inventory', path: '/dashboard' } },
  '/database/media-players': { label: 'Media Players', parent: { label: 'Inventory', path: '/dashboard' } },
  '/database/receptacle-boxes': { label: 'Receptacle Boxes', parent: { label: 'Inventory', path: '/dashboard' } },
};

export function UserProfileBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  if (!user) return null;

  // Get user initials for avatar fallback
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Derive breadcrumb info from current path
  const currentRoute = routeLabels[location.pathname];
  const pageLabel = currentRoute?.label || 'Dashboard';
  const parentRoute = currentRoute?.parent;

  return (
    <div className="flex-shrink-0 bg-slate-50/80 backdrop-blur-sm">
      <div className="flex items-center justify-between h-14 px-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard" className="text-slate-500 hover:text-slate-900">
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {parentRoute && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <span className="text-slate-500">
                      {parentRoute.label}
                    </span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2.5 h-auto py-1.5 px-2 -mr-2 hover:bg-slate-200/60 rounded-full"
            >
              <Avatar className="size-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-slate-900 text-white text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-slate-700">{user.name}</span>
              <ChevronDown className="size-3.5 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
                {user.companyName && (
                  <p className="text-xs text-muted-foreground font-normal flex items-center gap-1 mt-0.5">
                    <Building2 className="size-3" />{user.companyName}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
              <Settings className="mr-2 size-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
              <LogOut className="mr-2 size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator className="bg-slate-200/60" />
    </div>
  );
}