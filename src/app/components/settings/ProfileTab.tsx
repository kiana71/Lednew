/**
 * Profile Tab – User Settings
 *
 * Allows the user to update their name and username.
 */

import React, { useState } from 'react';
import { User } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Save, User as UserIcon, Shield } from 'lucide-react';
import { dataService } from '../../services/DataService';
import { toast } from 'sonner';
import { MAIN_ADMIN_EMAIL } from '../../config';

interface ProfileTabProps {
  user: User;
  onProfileUpdated: (updated: User) => void;
}

export function ProfileTab({ user, onProfileUpdated }: ProfileTabProps) {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [saving, setSaving] = useState(false);

  const dirty = name !== user.name || username !== user.username;

  const isMainAdmin = user.email === MAIN_ADMIN_EMAIL;
  const roleBadgeVariant = user.role === 'superadmin' ? 'destructive' : user.role === 'technician' ? 'default' : 'secondary';
  const roleLabel = user.role === 'superadmin' ? (isMainAdmin ? 'Super Admin' : 'Admin') : user.role === 'technician' ? 'Technician' : 'Viewer';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await dataService.updateUser(user.id, { name, username });
      if (response.success && response.data) {
        onProfileUpdated(response.data);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(response.error || 'Failed to update profile');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><UserIcon className="size-5" />Profile Information</CardTitle>
        <CardDescription>Update your personal information and display name</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled className="bg-slate-50" />
            <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex items-center gap-2 h-9">
              <Badge variant={roleBadgeVariant}><Shield className="size-3 mr-1" />{roleLabel}</Badge>
              <span className="text-xs text-muted-foreground">Role is managed by your system administrator</span>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={() => { setName(user.name); setUsername(user.username); }} disabled={!dirty}>Reset</Button>
            <Button type="submit" disabled={saving || !dirty} className="gap-2"><Save className="size-4" />{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}