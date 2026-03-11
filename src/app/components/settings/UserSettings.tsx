/**
 * User Settings – Orchestrator
 *
 * Tabbed layout composing ProfileTab, SecurityTab, and AccountTab.
 */

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { User as UserIcon, Lock, Info, Mail, AtSign } from 'lucide-react';

import { ProfileTab } from './ProfileTab';
import { SecurityTab } from './SecurityTab';
import { AccountTab } from './AccountTab';
import { MAIN_ADMIN_EMAIL } from '../../config';

export function UserSettings() {
  const { user, updateUserProfile } = useAuth();

  if (!user) return null;

  const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const isMainAdmin = user.email === MAIN_ADMIN_EMAIL;
  const roleBadgeVariant = user.role === 'superadmin' ? 'destructive' : user.role === 'technician' ? 'default' : 'secondary';
  const roleLabel = user.role === 'superadmin' ? (isMainAdmin ? 'Super Admin' : 'Admin') : user.role === 'technician' ? 'Technician' : 'Viewer';
  const isViewer = user.role === 'viewer';

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and security preferences</p>
        </div>

        {/* Profile Overview Card */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-5">
              <Avatar className="size-16">
                <AvatarFallback className="text-lg bg-slate-200 text-slate-700">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-semibold truncate">{user.name}</h2>
                  <Badge variant={roleBadgeVariant}>{roleLabel}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Mail className="size-3.5" />{user.email}</span>
                  <span className="flex items-center gap-1.5"><AtSign className="size-3.5" />{user.username}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Settings */}
        <Tabs defaultValue={isViewer ? 'account' : 'profile'}>
          <TabsList>
            {!isViewer && (
              <TabsTrigger value="profile" className="gap-1.5"><UserIcon className="size-4" />Profile</TabsTrigger>
            )}
            {!isViewer && (
              <TabsTrigger value="security" className="gap-1.5"><Lock className="size-4" />Security</TabsTrigger>
            )}
            <TabsTrigger value="account" className="gap-1.5"><Info className="size-4" />Account</TabsTrigger>
          </TabsList>

          {!isViewer && (
            <TabsContent value="profile">
              <ProfileTab user={user} onProfileUpdated={updateUserProfile} />
            </TabsContent>
          )}

          {!isViewer && (
            <TabsContent value="security">
              <SecurityTab user={user} />
            </TabsContent>
          )}

          <TabsContent value="account">
            <AccountTab user={user} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}