/**
 * Create User Pane
 *
 * Slide-in side panel for creating a new system user with
 * role selection, company name picker, and password strength validation.
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PasswordInput } from '../ui/password-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Separator } from '../ui/separator';
import { PasswordStrengthMeter, PasswordRequirements, PasswordMatchIndicator } from '../shared/PasswordStrength';
import { CompanyCombobox } from '../shared/CompanyCombobox';
import { dataService } from '../../services/DataService';
import { toast } from 'sonner';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateUserDialog({ open, onOpenChange, onCreated }: CreateUserDialogProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'technician' | 'viewer'>('technician');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = name.trim().length > 0 && username.trim().length > 0 && email.trim().length > 0 && companyName.trim().length > 0 && password.length >= 6 && passwordsMatch;

  const resetForm = () => {
    setName(''); setUsername(''); setEmail(''); setRole('technician'); setCompanyName(''); setPassword(''); setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      const response = await dataService.createUser({ name, username, email, password, role, companyName });
      if (response.success && response.data) {
        toast.success(`User "${name}" created successfully!`, { description: `Email: ${email}` });
        resetForm();
        onOpenChange(false);
        onCreated();
      } else {
        toast.error(response.error || 'Failed to create user');
      }
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <SheetContent side="right" className="sm:max-w-lg w-full p-0 gap-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b flex-shrink-0">
          <SheetTitle>Create New User</SheetTitle>
          <SheetDescription>Add a new user to the system with specified role and company</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-name">Full Name</Label>
                  <Input id="new-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-username">Username</Label>
                  <Input id="new-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="johndoe" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">Email</Label>
                <Input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john.doe@example.com" required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-role">Role</Label>
                  <Select value={role} onValueChange={(v: any) => setRole(v)}>
                    <SelectTrigger id="new-role"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <CompanyCombobox
                    value={companyName}
                    onChange={setCompanyName}
                    placeholder="Select or add..."
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">
                Users with the same company name share the same account and can see each other&apos;s drawings.
              </p>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="new-password">Password</Label>
                <PasswordInput id="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set initial password" required autoComplete="new-password" />
                <PasswordStrengthMeter password={password} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-confirm-password">Confirm Password</Label>
                <PasswordInput id="new-confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required autoComplete="new-password" />
                <PasswordMatchIndicator password={password} confirmPassword={confirmPassword} />
              </div>
              <PasswordRequirements password={password} />
            </div>
          </div>
          <SheetFooter className="px-6 py-4 border-t flex-shrink-0 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancel</Button>
            <Button type="submit" disabled={!canSubmit}>Create User</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}