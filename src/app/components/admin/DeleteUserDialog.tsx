/**
 * Delete User Dialog
 *
 * Confirmation dialog before permanently removing a user.
 */

import React from 'react';
import { User } from '../../types';
import { Badge } from '../ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../ui/alert-dialog';
import { getRoleBadgeVariant, getRoleLabel } from './adminHelpers';
import { dataService } from '../../services/DataService';
import { toast } from 'sonner';

interface DeleteUserDialogProps {
  user: User | null;
  currentUserId: string | undefined;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteUserDialog({ user, currentUserId, onOpenChange, onDeleted }: DeleteUserDialogProps) {
  const handleDelete = async () => {
    if (!user) return;
    if (user.role === 'superadmin') { toast.error('Cannot delete super admin account'); onOpenChange(false); return; }
    if (user.id === currentUserId) { toast.error('You cannot delete your own account'); onOpenChange(false); return; }

    try {
      const response = await dataService.deleteUser(user.id);
      if (response.success) {
        toast.success(`User "${user.name}" has been deleted.`);
        onDeleted();
      } else {
        toast.error(response.error || 'Failed to delete user');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={!!user} onOpenChange={(o) => !o && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <span className="font-semibold">{user?.name}</span>? This action cannot be undone and will permanently remove the user from the system.
            <div className="mt-3 space-y-1 text-sm">
              <div>Email: <span className="font-medium">{user?.email}</span></div>
              <div>Role: {user && <Badge variant={getRoleBadgeVariant(user.role)} className="ml-1">{getRoleLabel(user.role)}</Badge>}</div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete User</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
