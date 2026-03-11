/**
 * Security Tab – User Settings
 *
 * Change password with strength meter and requirements checklist.
 */

import React, { useState, useMemo } from 'react';
import { User } from '../../types';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { PasswordInput } from '../ui/password-input';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Lock, KeyRound } from 'lucide-react';
import { PasswordStrengthMeter, PasswordRequirements, PasswordMatchIndicator } from '../shared/PasswordStrength';
import { dataService } from '../../services/DataService';
import { toast } from 'sonner';

interface SecurityTabProps {
  user: User;
}

export function SecurityTab({ user }: SecurityTabProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = currentPassword.length > 0 && newPassword.length >= 6 && passwordsMatch;

  const clearForm = () => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await dataService.updateUserPassword(user.id, currentPassword, newPassword);
      if (response.success) { toast.success('Password updated successfully!'); clearForm(); }
      else toast.error(response.error || 'Failed to update password');
    } catch { toast.error('An unexpected error occurred'); }
    finally { setSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><KeyRound className="size-5" />Change Password</CardTitle>
        <CardDescription>Update your password to keep your account secure. Choose a strong password you haven't used before.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <PasswordInput id="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" required autoComplete="current-password" />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <PasswordInput id="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" required autoComplete="new-password" />
            <PasswordStrengthMeter password={newPassword} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <PasswordInput id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required autoComplete="new-password" />
            <PasswordMatchIndicator password={newPassword} confirmPassword={confirmPassword} />
          </div>
          <PasswordRequirements password={newPassword} />
          <Separator />
          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={clearForm} disabled={!currentPassword && !newPassword && !confirmPassword}>Clear</Button>
            <Button type="submit" disabled={saving || !canSubmit} className="gap-2"><Lock className="size-4" />{saving ? 'Updating...' : 'Update Password'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
