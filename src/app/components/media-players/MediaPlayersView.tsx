/**
 * Media Players Database View
 *
 * Manages the media players inventory with CRUD operations,
 * real-time search, column sorting, import/export, and stats dashboard.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { MediaPlayer } from '../../types';
import { inventoryService } from '../../services/InventoryService';
import { DatabaseTable, Column } from '../shared/DatabaseTable';
import { MediaPlayerFormDialog } from './MediaPlayerFormDialog';
import { MediaPlayerImportDialog } from './MediaPlayerImportDialog';
import { MediaPlayerStats } from '../shared/StatsCards';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../ui/alert-dialog';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { FileDown } from 'lucide-react';

export function MediaPlayersView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<MediaPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<MediaPlayer | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<MediaPlayer | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Guard — superadmin only
  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      toast.error('Access denied. Superadmin privileges required.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loadPlayers = async () => {
    setLoading(true);
    const res = await inventoryService.getMediaPlayers();
    if (res.success && res.data) setPlayers(res.data.items);
    setLoading(false);
  };

  useEffect(() => { loadPlayers(); }, []);

  const handleAdd = () => { setEditingPlayer(null); setFormOpen(true); };
  const handleEdit = (p: MediaPlayer) => { setEditingPlayer(p); setFormOpen(true); };
  const handleDelete = (p: MediaPlayer) => { setDeletingPlayer(p); };

  const confirmDelete = async () => {
    if (!deletingPlayer) return;
    const res = await inventoryService.deleteMediaPlayer(deletingPlayer.id);
    if (res.success) { toast.success('Media player deleted successfully'); loadPlayers(); }
    else toast.error(res.error || 'Failed to delete media player');
    setDeletingPlayer(null);
  };

  const handleFormSubmit = async (data: Omit<MediaPlayer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingPlayer) {
      const res = await inventoryService.updateMediaPlayer(editingPlayer.id, data);
      if (res.success) { toast.success('Media player updated successfully'); loadPlayers(); setFormOpen(false); }
      else toast.error(res.error || 'Failed to update media player');
    } else {
      const res = await inventoryService.createMediaPlayer(data);
      if (res.success) { toast.success('Media player added successfully'); loadPlayers(); setFormOpen(false); }
      else toast.error(res.error || 'Failed to add media player');
    }
  };

  const handleImport = async (imported: Partial<MediaPlayer>[]) => {
    let ok = 0, fail = 0;
    for (const d of imported) {
      const r = await inventoryService.createMediaPlayer(d as Omit<MediaPlayer, 'id' | 'createdAt' | 'updatedAt'>);
      if (r.success) ok++; else fail++;
    }
    if (ok > 0) { toast.success(`Imported ${ok} media player(s)`, { description: fail > 0 ? `${fail} failed` : undefined }); await loadPlayers(); setImportOpen(false); }
    else toast.error('Failed to import media players');
  };

  const handleExport = () => {
    if (players.length === 0) { toast.error('No media players to export'); return; }
    const headers = ['MFG. PART', 'Make', 'Height', 'Width', 'Depth', 'Alias'];
    const rows = players.map((p) => [p.model || '', p.manufacturer || '', `${p.dimensions.height}`, `${p.dimensions.width}`, `${p.dimensions.depth}`, p.alias || '']);
    const tsv = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `media-players-export-${new Date().toISOString().split('T')[0]}.tsv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success(`Exported ${players.length} media player(s)`);
  };

  const columns: Column<MediaPlayer>[] = [
    { key: 'alias', label: 'Alias', width: '22%' },
    { key: 'model', label: 'MFG. Part', width: '18%' },
    { key: 'manufacturer', label: 'Make', width: '18%' },
    { key: 'dimensions', label: 'Height', render: (i) => `${i.dimensions.height} ${i.dimensions.unit}`, width: '14%' },
    { key: 'dimensionsWidth', label: 'Width', render: (i) => `${i.dimensions.width} ${i.dimensions.unit}`, width: '14%' },
    { key: 'dimensionsDepth', label: 'Depth', render: (i) => `${i.dimensions.depth} ${i.dimensions.unit}`, width: '14%' },
  ];

  const uniqueMakes = new Set(players.filter((p) => p.manufacturer).map((p) => p.manufacturer)).size;

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 gap-6">
      {!loading && players.length > 0 && <MediaPlayerStats total={players.length} makes={uniqueMakes} />}

      <div className="flex-1 min-h-0">
        <DatabaseTable title="Media Players" columns={columns} data={players} loading={loading} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} onExport={handleExport} emptyMessage="No media players in database. Add your first media player to get started." searchPlaceholder="Search by alias, part number, make..."
          headerActions={<Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2"><FileDown className="size-4" />Import</Button>} />
      </div>

      <MediaPlayerFormDialog open={formOpen} onOpenChange={setFormOpen} mediaPlayer={editingPlayer} onSubmit={handleFormSubmit} />

      <AlertDialog open={!!deletingPlayer} onOpenChange={(open) => !open && setDeletingPlayer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Media Player</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete &ldquo;{deletingPlayer?.alias}&rdquo;? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MediaPlayerImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} />
    </div>
  );
}
