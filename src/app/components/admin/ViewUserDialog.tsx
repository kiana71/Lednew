/**
 * View User Pane
 *
 * Slide-in side panel showing full user details (read-only).
 */

import React from 'react';
import { User } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Mail, AtSign, Shield, Clock, Info, Pencil, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { getRoleBadgeVariant, getRoleLabel, getInitials } from './adminHelpers';

interface ViewUserDialogProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (user: User) => void;
}

export function ViewUserDialog({ user, onOpenChange, onEdit }: ViewUserDialogProps) {
  return (
    <Sheet open={!!user} onOpenChange={(o) => !o && onOpenChange(false)}>
      <SheetContent side="right" className="sm:max-w-md w-full p-0 gap-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b flex-shrink-0">
          <SheetTitle>User Details</SheetTitle>
          <SheetDescription>Account information for {user?.name}</SheetDescription>
        </SheetHeader>
        {user && (
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="size-14">
                <AvatarFallback className="text-base bg-slate-200 text-slate-700">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>
            <div className="divide-y">
              <DetailRow icon={<Mail className="size-4" />} label="Email" value={user.email} />
              <DetailRow icon={<AtSign className="size-4" />} label="Username" value={user.username} />
              <DetailRow icon={<Shield className="size-4" />} label="Role" value={<Badge variant={getRoleBadgeVariant(user.role)}>{getRoleLabel(user.role)}</Badge>} />
              <DetailRow icon={<Building2 className="size-4" />} label="Company" value={user.companyName || '—'} />
              <DetailRow icon={<Clock className="size-4" />} label="Created" value={format(new Date(user.createdAt), 'MMM d, yyyy')} />
              <DetailRow icon={<Clock className="size-4" />} label="Last Login" value={user.lastLogin ? format(new Date(user.lastLogin), "MMM d, yyyy 'at' h:mm a") : 'Never'} />
              <DetailRow icon={<Info className="size-4" />} label="User ID" value={<span className="font-mono text-xs">{user.id}</span>} />
            </div>
          </div>
        )}
        <SheetFooter className="px-6 py-4 border-t flex-shrink-0 flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          {user && user.role !== 'superadmin' && (
            <Button variant="outline" className="gap-2" onClick={() => { onOpenChange(false); onEdit(user); }}>
              <Pencil className="size-4" />Edit User
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</div>
      <div className="text-sm text-right">{value}</div>
    </div>
  );
}