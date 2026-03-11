/**
 * Share Drawing Pane
 *
 * Slide-in panel for sharing a drawing with other users.
 * Technicians / superadmin can share with anyone; viewers cannot share.
 *
 * Uses a replace-based approach: the full list of selected user IDs
 * is sent to `shareDrawing()`, which replaces the existing `sharedWith`
 * array in one atomic call — no fragile unshare loop needed.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Search, Share2, Check, Building2, Users } from 'lucide-react';
import { Drawing, User } from '../../types';
import { dataService } from '../../services/DataService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface ShareDrawingPaneProps {
  drawing: Drawing | null;
  onOpenChange: (open: boolean) => void;
  onShared: () => void;
}

export function ShareDrawingPane({ drawing, onOpenChange, onShared }: ShareDrawingPaneProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'technician' || user?.role === 'superadmin';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Seed state when the pane opens with a new drawing
  useEffect(() => {
    if (!drawing) return;
    setSelectedIds(new Set(drawing.sharedWith || []));
    loadUsers();
  }, [drawing]);

  const loadUsers = async () => {
    setLoading(true);
    const res = await dataService.getAllUsers();
    if (res.success && res.data) {
      // Hide superadmin from the user list
      setUsers(res.data.filter((u) => u.role !== 'superadmin'));
    }
    setLoading(false);
  };

  // ── Build the list of users that can be selected ──────────────────
  const availableUsers = useMemo(() => {
    // Exclude the current user (can't share with yourself)
    let list = users.filter((u) => u.id !== user?.id);

    // Technicians / superadmin see everyone; viewers were already blocked
    // at the UI level (share button hidden), but just in case:
    if (!isAdmin && user?.companyName) {
      list = list.filter((u) => u.companyName === user.companyName);
    }

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.companyName?.toLowerCase().includes(q),
      );
    }

    return list;
  }, [users, search, user, isAdmin]);

  // ── Toggle a single user ──────────────────────────────────────────
  const toggleUser = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Dirty check (has the selection changed from the original?) ────
  const originalIds = useMemo(
    () => new Set(drawing?.sharedWith || []),
    [drawing],
  );
  const isDirty = useMemo(() => {
    if (selectedIds.size !== originalIds.size) return true;
    for (const id of selectedIds) {
      if (!originalIds.has(id)) return true;
    }
    return false;
  }, [selectedIds, originalIds]);

  // ── Save — single atomic replace ─────────────────────────────────
  const handleShare = async () => {
    if (!drawing) return;
    setSaving(true);

    const ids = Array.from(selectedIds);
    const res = await dataService.shareDrawing(drawing.id, ids);

    if (res.success) {
      const added = ids.filter((id) => !originalIds.has(id)).length;
      const removed = Array.from(originalIds).filter((id) => !selectedIds.has(id)).length;

      // Build a context-aware toast message
      const parts: string[] = [];
      if (added > 0) parts.push(`shared with ${added} new ${added === 1 ? 'user' : 'users'}`);
      if (removed > 0) parts.push(`removed ${removed} ${removed === 1 ? 'user' : 'users'}`);
      const msg = parts.length > 0 ? `Drawing ${parts.join(', ')}` : 'Sharing unchanged';

      toast.success(msg);
      onOpenChange(false);
      onShared();
    } else {
      toast.error(res.error || 'Failed to update sharing');
    }

    setSaving(false);
  };

  // ── Helpers ───────────────────────────────────────────────────────
  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const roleBadge = (role: string) => {
    if (role === 'technician') {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-200 text-blue-700 bg-blue-50">
          Technician
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-200 text-slate-600 bg-slate-50">
        Viewer
      </Badge>
    );
  };

  return (
    <Sheet open={!!drawing} onOpenChange={(o) => { if (!o) { setSearch(''); onOpenChange(false); } }}>
      <SheetContent side="right" className="sm:max-w-md w-full p-0 gap-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Share2 className="size-5" />
            Share Drawing
          </SheetTitle>
          <SheetDescription>
            {drawing?.title}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Search */}
          <div className="px-6 py-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or company..."
                className="pl-9"
              />
            </div>
            {isAdmin && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Users className="size-3" />
                Showing all users — technicians can share with anyone
              </p>
            )}
            {!isAdmin && user?.companyName && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Building2 className="size-3" />
                Showing users from {user.companyName}
              </p>
            )}
          </div>

          {/* User list */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-3 space-y-1">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading users...</p>
              ) : availableUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {search ? 'No users match your search' : 'No users available to share with'}
                </p>
              ) : (
                availableUsers.map((u) => {
                  const isSelected = selectedIds.has(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleUser(u.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        isSelected ? 'bg-accent ring-1 ring-ring/20' : 'hover:bg-accent/50'
                      }`}
                    >
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs bg-slate-200 text-slate-600">
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm truncate">{u.name}</p>
                          {roleBadge(u.role)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">{u.email}</span>
                          {u.companyName && (
                            <>
                              <span className="text-muted-foreground/40">&middot;</span>
                              <span className="truncate">{u.companyName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isSelected ? (
                          <div className="size-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="size-3 text-primary-foreground" />
                          </div>
                        ) : (
                          <div className="size-5 rounded-full border-2 border-muted-foreground/25" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected count footer */}
          {selectedIds.size > 0 && (
            <div className="px-6 py-2 border-t bg-muted/40">
              <p className="text-xs text-muted-foreground">
                Shared with {selectedIds.size} {selectedIds.size === 1 ? 'user' : 'users'}
              </p>
            </div>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t flex-shrink-0 flex-row justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleShare} disabled={!isDirty || saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
