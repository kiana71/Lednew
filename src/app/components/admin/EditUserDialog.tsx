/**
 * Edit User Pane
 *
 * Slide-in side panel for editing user profile (name, username, role, company).
 */

import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { dataService } from '../../services/DataService';
import { toast } from 'sonner';
import { CompanyCombobox } from '../shared/CompanyCombobox';

interface EditUserDialogProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function EditUserDialog({ user, onOpenChange, onUpdated }: EditUserDialogProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'technician' | 'viewer'>('technician');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setUsername(user.username);
      setRole(user.role === 'superadmin' ? 'technician' : (user.role as 'technician' | 'viewer'));
      setCompanyName(user.companyName || '');
    }
  }, [user]);

  const dirty = user && (name !== user.name || username !== user.username || role !== user.role || companyName !== (user.companyName || ''));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const response = await dataService.updateUser(user.id, { name, username, role, companyName: companyName || undefined });
      if (response.success) {
        toast.success(`User "${name}" updated successfully!`);
        onOpenChange(false);
        onUpdated();
      } else {
        toast.error(response.error || 'Failed to update user');
      }
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <Sheet open={!!user} onOpenChange={(o) => !o && onOpenChange(false)}>
      <SheetContent side="right" className="sm:max-w-lg w-full p-0 gap-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b flex-shrink-0">
          <SheetTitle>Edit User</SheetTitle>
          <SheetDescription>Update profile information for {user?.name}</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-username">Username</Label>
                  <Input id="edit-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="bg-slate-50" />
                <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select value={role} onValueChange={(v: any) => setRole(v)}>
                    <SelectTrigger id="edit-role"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-company">Company Name</Label>
                  <CompanyCombobox
                    value={companyName}
                    onChange={setCompanyName}
                    placeholder="Select or add..."
                    id="edit-company"
                  />
                </div>
              </div>
            </div>
          </div>
          <SheetFooter className="px-6 py-4 border-t flex-shrink-0 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!dirty}>Save Changes</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}