/**
 * Receptacle Boxes Database View
 *
 * Manages the receptacle boxes inventory with CRUD operations,
 * real-time search, column sorting, import/export, and stats dashboard.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { ReceptacleBox } from '../../types';
import { inventoryService } from '../../services/InventoryService';
import { DatabaseTable, Column } from '../shared/DatabaseTable';
import { ReceptacleBoxFormDialog } from './ReceptacleBoxFormDialog';
import { ReceptacleBoxImportDialog } from './ReceptacleBoxImportDialog';
import { ReceptacleBoxStats } from '../shared/StatsCards';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../ui/alert-dialog';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { FileDown } from 'lucide-react';

export function ReceptacleBoxesView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boxes, setBoxes] = useState<ReceptacleBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBox, setEditingBox] = useState<ReceptacleBox | null>(null);
  const [deletingBox, setDeletingBox] = useState<ReceptacleBox | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Guard — superadmin only
  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      toast.error('Access denied. Superadmin privileges required.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loadBoxes = async () => {
    setLoading(true);
    const res = await inventoryService.getReceptacleBoxes();
    if (res.success && res.data) setBoxes(res.data.items);
    setLoading(false);
  };

  useEffect(() => { loadBoxes(); }, []);

  const handleAdd = () => { setEditingBox(null); setFormOpen(true); };
  const handleEdit = (b: ReceptacleBox) => { setEditingBox(b); setFormOpen(true); };
  const handleDelete = (b: ReceptacleBox) => { setDeletingBox(b); };

  const confirmDelete = async () => {
    if (!deletingBox) return;
    const res = await inventoryService.deleteReceptacleBox(deletingBox.id);
    if (res.success) { toast.success('Receptacle box deleted successfully'); loadBoxes(); }
    else toast.error(res.error || 'Failed to delete receptacle box');
    setDeletingBox(null);
  };

  const handleFormSubmit = async (data: Omit<ReceptacleBox, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingBox) {
      const res = await inventoryService.updateReceptacleBox(editingBox.id, data);
      if (res.success) { toast.success('Receptacle box updated successfully'); loadBoxes(); setFormOpen(false); }
      else toast.error(res.error || 'Failed to update receptacle box');
    } else {
      const res = await inventoryService.createReceptacleBox(data);
      if (res.success) { toast.success('Receptacle box added successfully'); loadBoxes(); setFormOpen(false); }
      else toast.error(res.error || 'Failed to add receptacle box');
    }
  };

  const handleImport = async (imported: Partial<ReceptacleBox>[]) => {
    let ok = 0, fail = 0;
    for (const d of imported) {
      const r = await inventoryService.createReceptacleBox(d as Omit<ReceptacleBox, 'id' | 'createdAt' | 'updatedAt'>);
      if (r.success) ok++; else fail++;
    }
    if (ok > 0) { toast.success(`Imported ${ok} receptacle box(es)`, { description: fail > 0 ? `${fail} failed` : undefined }); await loadBoxes(); setImportOpen(false); }
    else toast.error('Failed to import receptacle boxes');
  };

  const handleExport = () => {
    if (boxes.length === 0) { toast.error('No receptacle boxes to export'); return; }
    const headers = ['MFG. PART', 'Brand', 'Width (in)', 'Height (in)', 'Depth (in)', 'Pseudonym'];
    const rows = boxes.map((b) => [b.model || '', b.manufacturer || '', `${b.dimensions.width}`, `${b.dimensions.height}`, `${b.dimensions.depth}`, b.alias || '']);
    const tsv = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `receptacle-boxes-export-${new Date().toISOString().split('T')[0]}.tsv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success(`Exported ${boxes.length} receptacle box(es)`);
  };

  const columns: Column<ReceptacleBox>[] = [
    { key: 'alias', label: 'Pseudonym', width: '22%' },
    { key: 'model', label: 'MFG. Part', width: '18%' },
    { key: 'manufacturer', label: 'Brand', width: '16%' },
    { key: 'dimensionsWidth', label: 'Width (in)', render: (i) => `${i.dimensions.width} ${i.dimensions.unit}`, width: '14%' },
    { key: 'dimensionsHeight', label: 'Height (in)', render: (i) => `${i.dimensions.height} ${i.dimensions.unit}`, width: '14%' },
    { key: 'dimensionsDepth', label: 'Depth (in)', render: (i) => `${i.dimensions.depth} ${i.dimensions.unit}`, width: '14%' },
  ];

  const uniqueBrands = new Set(boxes.filter((b) => b.manufacturer).map((b) => b.manufacturer)).size;

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 gap-6">
      {!loading && boxes.length > 0 && <ReceptacleBoxStats total={boxes.length} brands={uniqueBrands} />}

      <div className="flex-1 min-h-0">
        <DatabaseTable title="Receptacle Boxes" columns={columns} data={boxes} loading={loading} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} onExport={handleExport} emptyMessage="No receptacle boxes in database. Add your first receptacle box to get started." searchPlaceholder="Search by pseudonym, part number, brand..."
          headerActions={<Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2"><FileDown className="size-4" />Import</Button>} />
      </div>

      <ReceptacleBoxFormDialog open={formOpen} onOpenChange={setFormOpen} receptacleBox={editingBox} onSubmit={handleFormSubmit} />

      <AlertDialog open={!!deletingBox} onOpenChange={(open) => !open && setDeletingBox(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Receptacle Box</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete &ldquo;{deletingBox?.alias}&rdquo;? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReceptacleBoxImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} />
    </div>
  );
}
