/**
 * Admins Panel
 *
 * Manages superadmin accounts. Accessible only by superadmins.
 * Two-tier system:
 *   - Main Admin (MAIN_ADMIN_EMAIL): crown badge, can delete other admins, cannot be deleted/edited.
 *   - Regular Admins: can create admins, edit (name/username only), reset passwords. Cannot delete.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { User } from '../../types';
import { dataService } from '../../services/DataService';
import { MAIN_ADMIN_EMAIL } from '../../config';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '../ui/sheet';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { PasswordInput } from '../ui/password-input';
import { PasswordStrengthMeter, PasswordRequirements, PasswordMatchIndicator } from '../shared/PasswordStrength';
import {
  ShieldCheck, UserPlus, Trash2, Search, Pencil, KeyRound, Info, Crown,
} from 'lucide-react';
import { getInitials } from './adminHelpers';
import { ViewUserDialog } from './ViewUserDialog';
import { ResetPasswordDialog } from './ResetPasswordDialog';

// ─── Main Component ──────────────────────────────────────────────────────────

export function AdminsPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pane targets
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [adminToEdit, setAdminToEdit] = useState<User | null>(null);
  const [adminToView, setAdminToView] = useState<User | null>(null);
  const [adminToResetPassword, setAdminToResetPassword] = useState<User | null>(null);
  const [adminToDelete, setAdminToDelete] = useState<User | null>(null);

  const isMainAdmin = user?.email === MAIN_ADMIN_EMAIL;

  // Guard – only superadmin
  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      toast.error('Access denied. Superadmin privileges required.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const response = await dataService.getAllUsers();
      if (response.success && response.data) {
        setAdmins(response.data.filter((u) => u.role === 'superadmin'));
      } else {
        toast.error(response.error || 'Failed to load admins');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdmins(); }, []);

  const filteredAdmins = useMemo(() => {
    if (!searchQuery.trim()) return admins;
    const q = searchQuery.toLowerCase();
    return admins.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.username.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q),
    );
  }, [admins, searchQuery]);

  if (!user || user.role !== 'superadmin') return null;

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <ShieldCheck className="size-6" />Admin Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage superadmin accounts
            </p>
          </div>
          {isMainAdmin && (
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <UserPlus className="size-4" />Create Admin
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total Admins" value={admins.length} icon={<ShieldCheck className="size-5 text-slate-600" />} />
          <StatCard
            label="Main Admin"
            value={admins.find((a) => a.email === MAIN_ADMIN_EMAIL)?.name || '—'}
            icon={<Crown className="size-5 text-amber-500" />}
            isText
          />
        </div>

        {/* Admin Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-5" />Administrators ({filteredAdmins.length}{searchQuery ? ` of ${admins.length}` : ''})
                </CardTitle>
                <CardDescription>View and manage all superadmin accounts</CardDescription>
              </div>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search admins by name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12"><p className="text-muted-foreground">Loading admins...</p></div>
            ) : filteredAdmins.length === 0 ? (
              <div className="text-center py-12"><p className="text-muted-foreground">{searchQuery ? 'No admins match your search' : 'No admins found'}</p></div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmins.map((a) => {
                      const isMain = a.email === MAIN_ADMIN_EMAIL;
                      return (
                        <TableRow key={a.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="size-8">
                                <AvatarFallback className="text-xs bg-slate-100 text-slate-600">
                                  {getInitials(a.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{a.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{a.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isMain ? (
                              <Badge variant="default" className="gap-1 bg-amber-600 hover:bg-amber-700">
                                <Crown className="size-3" />Main
                              </Badge>
                            ) : (
                              <Badge variant="outline">Admin</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {a.lastLogin
                              ? formatDistanceToNow(new Date(a.lastLogin), { addSuffix: true })
                              : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="size-8 p-0"
                                onClick={() => setAdminToView(a)} title="View details">
                                <Info className="size-4" />
                              </Button>
                              {/* Cannot edit the Main Admin */}
                              {!isMain && (
                                <Button variant="ghost" size="sm" className="size-8 p-0"
                                  onClick={() => setAdminToEdit(a)} title="Edit admin">
                                  <Pencil className="size-4" />
                                </Button>
                              )}
                              {/* Only Main Admin can reset other admins' passwords */}
                              {isMainAdmin && !isMain && (
                                <Button variant="ghost" size="sm" className="size-8 p-0"
                                  onClick={() => setAdminToResetPassword(a)} title="Reset password">
                                  <KeyRound className="size-4" />
                                </Button>
                              )}
                              {/* Only Main Admin can delete other admins, and never themselves */}
                              {isMainAdmin && !isMain && a.id !== user?.id && (
                                <Button variant="ghost" size="sm"
                                  className="size-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setAdminToDelete(a)} title="Delete admin">
                                  <Trash2 className="size-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* ── Panes ────────────────────────────────────────────────────────── */}

      {/* Create Admin */}
      <CreateAdminDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onCreated={loadAdmins} />

      {/* Edit Admin (name + username only) */}
      <EditAdminDialog admin={adminToEdit} onOpenChange={() => setAdminToEdit(null)} onUpdated={loadAdmins} />

      {/* View Admin */}
      <ViewUserDialog user={adminToView} onOpenChange={() => setAdminToView(null)} onEdit={(u) => setAdminToEdit(u)} />

      {/* Reset Password */}
      <ResetPasswordDialog user={adminToResetPassword} onOpenChange={() => setAdminToResetPassword(null)} />

      {/* Delete Admin (Main Admin only) */}
      <AlertDialog open={!!adminToDelete} onOpenChange={(o) => !o && setAdminToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{adminToDelete?.name}</span>?
              This action cannot be undone and will permanently remove this admin account.
              <div className="mt-3 text-sm">
                Email: <span className="font-medium">{adminToDelete?.email}</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!adminToDelete) return;
                try {
                  const response = await dataService.deleteUser(adminToDelete.id);
                  if (response.success) {
                    toast.success(`Admin "${adminToDelete.name}" has been deleted.`);
                    loadAdmins();
                  } else {
                    toast.error(response.error || 'Failed to delete admin');
                  }
                } catch {
                  toast.error('An unexpected error occurred');
                } finally {
                  setAdminToDelete(null);
                }
              }}
            >
              Delete Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Create Admin Dialog ────────────────────────────────────────────────────

function CreateAdminDialog({ open, onOpenChange, onCreated }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = name.trim().length > 0 && username.trim().length > 0 && email.trim().length > 0 && password.length >= 6 && passwordsMatch;

  const resetForm = () => {
    setName(''); setUsername(''); setEmail(''); setPassword(''); setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      const response = await dataService.createUser({
        name,
        username,
        email,
        password,
        role: 'superadmin',
        companyName: '',
      });
      if (response.success && response.data) {
        toast.success(`Admin "${name}" created successfully!`, { description: `Email: ${email}` });
        resetForm();
        onOpenChange(false);
        onCreated();
      } else {
        toast.error(response.error || 'Failed to create admin');
      }
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <SheetContent side="right" className="sm:max-w-lg w-full p-0 gap-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b flex-shrink-0">
          <SheetTitle>Create New Admin</SheetTitle>
          <SheetDescription>Add a new superadmin account with full system access</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-name">Full Name</Label>
                  <Input id="admin-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-username">Username</Label>
                  <Input id="admin-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="arivera" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@company.com" required />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <PasswordInput id="admin-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set initial password" required autoComplete="new-password" />
                <PasswordStrengthMeter password={password} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-confirm">Confirm Password</Label>
                <PasswordInput id="admin-confirm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required autoComplete="new-password" />
                <PasswordMatchIndicator password={password} confirmPassword={confirmPassword} />
              </div>
              <PasswordRequirements password={password} />
            </div>
          </div>
          <SheetFooter className="px-6 py-4 border-t flex-shrink-0 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancel</Button>
            <Button type="submit" disabled={!canSubmit}>Create Admin</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Edit Admin Dialog (name + username only) ───────────────────────────────

function EditAdminDialog({ admin, onOpenChange, onUpdated }: {
  admin: User | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (admin) {
      setName(admin.name);
      setUsername(admin.username);
    }
  }, [admin]);

  const dirty = admin && (name !== admin.name || username !== admin.username);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;
    try {
      const response = await dataService.updateUser(admin.id, { name, username });
      if (response.success) {
        toast.success(`Admin "${name}" updated successfully!`);
        onOpenChange(false);
        onUpdated();
      } else {
        toast.error(response.error || 'Failed to update admin');
      }
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <Sheet open={!!admin} onOpenChange={(o) => !o && onOpenChange(false)}>
      <SheetContent side="right" className="sm:max-w-lg w-full p-0 gap-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b flex-shrink-0">
          <SheetTitle>Edit Admin</SheetTitle>
          <SheetDescription>Update profile information for {admin?.name}</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-admin-name">Full Name</Label>
                  <Input id="edit-admin-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-admin-username">Username</Label>
                  <Input id="edit-admin-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={admin?.email || ''} disabled className="bg-slate-50" />
                <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value="Super Admin" disabled className="bg-slate-50" />
                <p className="text-xs text-muted-foreground">Admin role cannot be changed from this panel</p>
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

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, isText }: { label: string; value: number | string; icon: React.ReactNode; isText?: boolean }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={isText ? 'text-base font-semibold truncate' : 'text-2xl font-semibold'}>{value}</p>
          </div>
          <div className="size-10 rounded-lg bg-slate-100 flex items-center justify-center">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
