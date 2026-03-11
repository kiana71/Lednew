/**
 * Account Tab – User Settings
 *
 * Read-only account details view.
 */

import React from 'react';
import { User } from '../../types';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { User as UserIcon, Mail, AtSign, Shield, Clock, Info } from 'lucide-react';
import { format } from 'date-fns';
import { MAIN_ADMIN_EMAIL } from '../../config';

interface AccountTabProps {
  user: User;
}

export function AccountTab({ user }: AccountTabProps) {
  const isMainAdmin = user.email === MAIN_ADMIN_EMAIL;
  const roleBadgeVariant = user.role === 'superadmin' ? 'destructive' : user.role === 'technician' ? 'default' : 'secondary';
  const roleLabel = user.role === 'superadmin' ? (isMainAdmin ? 'Super Admin' : 'Admin') : user.role === 'technician' ? 'Technician' : 'Viewer';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Info className="size-5" />Account Information</CardTitle>
        <CardDescription>Details about your account and session</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          <Row icon={<UserIcon className="size-4" />} label="User ID" value={<span className="font-mono text-xs">{user.id}</span>} />
          <Row icon={<Mail className="size-4" />} label="Email Address" value={user.email} />
          <Row icon={<AtSign className="size-4" />} label="Username" value={user.username} />
          <Row icon={<Shield className="size-4" />} label="Role" value={<Badge variant={roleBadgeVariant}>{roleLabel}</Badge>} />
          <Row icon={<Clock className="size-4" />} label="Account Created" value={format(new Date(user.createdAt), 'MMMM d, yyyy')} />
          <Row icon={<Clock className="size-4" />} label="Last Login" value={user.lastLogin ? format(new Date(user.lastLogin), "MMMM d, yyyy 'at' h:mm a") : 'Never'} />
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">{icon}{label}</div>
      <div className="text-sm text-right">{value}</div>
    </div>
  );
}