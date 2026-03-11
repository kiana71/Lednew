/**
 * User Manager View
 *
 * Admin view for managing technician and viewer accounts.
 * Accessible by superadmin only.
 * Superadmin accounts are managed in AdminsPanel (/admin/admins).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { User } from '../../types';
import { dataService } from '../../services/DataService';
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
  UserPlus, Trash2, Shield, Users as UsersIcon, Search, Pencil, KeyRound, Info, Building2,
} from 'lucide-react';

import { CreateUserDialog } from './CreateUserDialog';
import { EditUserDialog } from './EditUserDialog';
import { ViewUserDialog } from './ViewUserDialog';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { DeleteUserDialog } from './DeleteUserDialog';
import { getRoleBadgeVariant, getRoleLabel, getInitials } from './adminHelpers';

export function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pane targets
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToView, setUserToView] = useState<User | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Guard – only superadmin
  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      toast.error('Access denied. Superadmin privileges required.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await dataService.getAllUsers();
      if (response.success && response.data) {
        // Hide the superadmin from the list
        setUsers(response.data.filter((u) => u.role !== 'superadmin'));
      } else {
        toast.error(response.error || 'Failed to load users');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.companyName?.toLowerCase().includes(q),
    );
  }, [users, searchQuery]);

  if (!user || user.role !== 'superadmin') return null;

  // Stats
  const techCount = users.filter((u) => u.role === 'technician').length;
  const viewerCount = users.filter((u) => u.role === 'viewer').length;
  const companyCount = new Set(users.map((u) => u.companyName).filter(Boolean)).size;

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <UsersIcon className="size-6" />User Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage users, roles, and company accounts</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <UserPlus className="size-4" />Create User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Users" value={users.length} icon={<UsersIcon className="size-5 text-slate-600" />} />
          <StatCard label="Technicians" value={techCount} icon={<Shield className="size-5 text-slate-600" />} />
          <StatCard label="Viewers" value={viewerCount} icon={<UsersIcon className="size-5 text-slate-600" />} />
          <StatCard label="Companies" value={companyCount} icon={<Building2 className="size-5 text-slate-600" />} />
        </div>

        {/* User Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UsersIcon className="size-5" />Users ({filteredUsers.length}{searchQuery ? ` of ${users.length}` : ''})
                </CardTitle>
                <CardDescription>View and manage all system users</CardDescription>
              </div>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search users by name, email, company, or role..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12"><p className="text-muted-foreground">Loading users...</p></div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12"><p className="text-muted-foreground">{searchQuery ? 'No users match your search' : 'No users found'}</p></div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8"><AvatarFallback className="text-xs bg-slate-100 text-slate-600">{getInitials(u.name)}</AvatarFallback></Avatar>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{u.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {u.companyName ? (
                            <span className="inline-flex items-center gap-1.5 text-slate-700">
                              <Building2 className="size-3.5 text-slate-400" />
                              {u.companyName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell><Badge variant={getRoleBadgeVariant(u.role)}>{getRoleLabel(u.role)}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.lastLogin ? formatDistanceToNow(new Date(u.lastLogin), { addSuffix: true }) : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="size-8 p-0" onClick={() => setUserToView(u)} title="View details"><Info className="size-4" /></Button>
                            <Button variant="ghost" size="sm" className="size-8 p-0" onClick={() => setUserToEdit(u)} title="Edit user"><Pencil className="size-4" /></Button>
                            <Button variant="ghost" size="sm" className="size-8 p-0" onClick={() => setUserToResetPassword(u)} title="Reset password"><KeyRound className="size-4" /></Button>
                            {u.id !== user?.id && (
                              <Button variant="ghost" size="sm" className="size-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setUserToDelete(u)} title="Delete user"><Trash2 className="size-4" /></Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Panes */}
      <CreateUserDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onCreated={loadUsers} />
      <EditUserDialog user={userToEdit} onOpenChange={() => setUserToEdit(null)} onUpdated={loadUsers} />
      <ViewUserDialog user={userToView} onOpenChange={() => setUserToView(null)} onEdit={(u) => setUserToEdit(u)} />
      <ResetPasswordDialog user={userToResetPassword} onOpenChange={() => setUserToResetPassword(null)} />
      <DeleteUserDialog user={userToDelete} currentUserId={user?.id} onOpenChange={() => setUserToDelete(null)} onDeleted={loadUsers} />
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
          <div className="size-10 rounded-lg bg-slate-100 flex items-center justify-center">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}