/**
 * Mounts Database View
 *
 * Manages the mounts inventory with CRUD operations,
 * real-time search, column sorting, import/export, and stats dashboard.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { Mount } from '../../types';
import { inventoryService } from '../../services/InventoryService';
import { DatabaseTable, Column } from '../shared/DatabaseTable';
import { MountFormDialog } from './MountFormDialog';
import { MountImportDialog } from './MountImportDialog';
import { MountStats } from '../shared/StatsCards';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../ui/alert-dialog';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { FileDown } from 'lucide-react';

export function MountsView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mounts, setMounts] = useState<Mount[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMount, setEditingMount] = useState<Mount | null>(null);
  const [deletingMount, setDeletingMount] = useState<Mount | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Guard — superadmin only
  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      toast.error('Access denied. Superadmin privileges required.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loadMounts = async () => {
    setLoading(true);
    const response = await inventoryService.getMounts();
    if (response.success && response.data) setMounts(response.data.items);
    setLoading(false);
  };

  useEffect(() => { loadMounts(); }, []);

  const handleAdd = () => { setEditingMount(null); setFormOpen(true); };
  const handleEdit = (m: Mount) => { setEditingMount(m); setFormOpen(true); };
  const handleDelete = (m: Mount) => { setDeletingMount(m); };

  const confirmDelete = async () => {
    if (!deletingMount) return;
    const res = await inventoryService.deleteMount(deletingMount.id);
    if (res.success) { toast.success('Mount deleted successfully'); loadMounts(); }
    else toast.error(res.error || 'Failed to delete mount');
    setDeletingMount(null);
  };

  const handleFormSubmit = async (data: Omit<Mount, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingMount) {
      const res = await inventoryService.updateMount(editingMount.id, data);
      if (res.success) { toast.success('Mount updated successfully'); loadMounts(); setFormOpen(false); }
      else toast.error(res.error || 'Failed to update mount');
    } else {
      const res = await inventoryService.createMount(data);
      if (res.success) { toast.success('Mount added successfully'); loadMounts(); setFormOpen(false); }
      else toast.error(res.error || 'Failed to add mount');
    }
  };

  const handleImport = async (imported: Partial<Mount>[]) => {
    let ok = 0, fail = 0;
    for (const d of imported) {
      const r = await inventoryService.createMount(d as Omit<Mount, 'id' | 'createdAt' | 'updatedAt'>);
      if (r.success) ok++; else fail++;
    }
    if (ok > 0) { toast.success(`Imported ${ok} mount(s)`, { description: fail > 0 ? `${fail} failed` : undefined }); await loadMounts(); setImportOpen(false); }
    else toast.error('Failed to import mounts');
  };

  const handleExport = () => {
    if (mounts.length === 0) { toast.error('No mounts to export'); return; }
    const headers = ['MFG. PART', 'Brand', 'Maximum Load (lbs)', 'Width (in)', 'Height (in)', 'Depth (in)', 'Clearance needed around screen', 'Alias'];
    const rows = mounts.map((m) => [m.model || '', m.manufacturer || '', m.maxLoadLbs ? `${m.maxLoadLbs}` : '', `${m.dimensions.width}`, `${m.dimensions.height}`, `${m.dimensions.depth}`, m.clearance || '', m.alias || '']);
    const tsv = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `mounts-export-${new Date().toISOString().split('T')[0]}.tsv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success(`Exported ${mounts.length} mount(s)`);
  };

  const columns: Column<Mount>[] = [
    { key: 'alias', label: 'Alias', width: '18%' },
    { key: 'model', label: 'MFG. Part', width: '14%' },
    { key: 'manufacturer', label: 'Brand', width: '14%' },
    { key: 'maxLoadLbs', label: 'Max Load', render: (i) => (i.maxLoadLbs ? `${i.maxLoadLbs} lbs` : '-'), width: '10%' },
    { key: 'dimensions', label: 'Dimensions (WxHxD)', render: (i) => `${i.dimensions.width} x ${i.dimensions.height} x ${i.dimensions.depth} ${i.dimensions.unit}`, width: '20%' },
    { key: 'clearance', label: 'Clearance', render: (i) => i.clearance || '-', width: '24%' },
  ];

  const uniqueBrands = new Set(mounts.filter((m) => m.manufacturer).map((m) => m.manufacturer)).size;
  const withLoad = mounts.filter((m) => m.maxLoadLbs);
  const avgLoad = withLoad.length > 0 ? withLoad.reduce((s, m) => s + (m.maxLoadLbs || 0), 0) / withLoad.length : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 gap-6">
      {!loading && mounts.length > 0 && <MountStats total={mounts.length} brands={uniqueBrands} averageLoad={avgLoad} />}

      <div className="flex-1 min-h-0">
        <DatabaseTable title="Mounts" columns={columns} data={mounts} loading={loading} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} onExport={handleExport} emptyMessage="No mounts in database. Add your first mount to get started." searchPlaceholder="Search by alias, part number, brand..."
          headerActions={<Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2"><FileDown className="size-4" />Import</Button>} />
      </div>

      <MountFormDialog open={formOpen} onOpenChange={setFormOpen} mount={editingMount} onSubmit={handleFormSubmit} />

      <AlertDialog open={!!deletingMount} onOpenChange={(open) => !open && setDeletingMount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mount</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete &ldquo;{deletingMount?.alias}&rdquo;? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MountImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} />
    </div>
  );
}
