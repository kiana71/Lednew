/**
 * Reset Password Pane
 *
 * Slide-in side panel for resetting a user's password.
 */

import React, { useState } from 'react';
import { User } from '../../types';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { PasswordInput } from '../ui/password-input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { PasswordStrengthMeter, PasswordRequirements, PasswordMatchIndicator } from '../shared/PasswordStrength';
import { KeyRound } from 'lucide-react';
import { dataService } from '../../services/DataService';
import { toast } from 'sonner';

interface ResetPasswordDialogProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({ user, onOpenChange }: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = newPassword.length >= 6 && passwordsMatch;

  const handleClose = () => {
    setNewPassword(''); setConfirmPassword(''); onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canSubmit) return;
    try {
      const response = await dataService.updateUserPassword(user.id, '', newPassword);
      if (response.success) {
        toast.success(`Password for "${user.name}" has been reset.`);
        handleClose();
      } else {
        toast.error(response.error || 'Failed to reset password');
      }
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <Sheet open={!!user} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <SheetContent side="right" className="sm:max-w-md w-full p-0 gap-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b flex-shrink-0">
          <SheetTitle className="flex items-center gap-2"><KeyRound className="size-5" />Reset Password</SheetTitle>
          <SheetDescription>
            Set a new password for <span className="font-medium">{user?.name}</span> ({user?.email})
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="reset-new-password">New Password</Label>
                <PasswordInput id="reset-new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" required autoComplete="new-password" />
                <PasswordStrengthMeter password={newPassword} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-confirm-password">Confirm Password</Label>
                <PasswordInput id="reset-confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required autoComplete="new-password" />
                <PasswordMatchIndicator password={newPassword} confirmPassword={confirmPassword} />
              </div>
              <PasswordRequirements password={newPassword} />
            </div>
          </div>
          <SheetFooter className="px-6 py-4 border-t flex-shrink-0 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={!canSubmit}>Reset Password</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
