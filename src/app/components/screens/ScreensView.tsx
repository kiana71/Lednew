/**
 * Screens Database View
 *
 * Manages the screens inventory with CRUD operations,
 * real-time search, column sorting, import/export, and stats dashboard.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { Screen } from '../../types';
import { inventoryService } from '../../services/InventoryService';
import { DatabaseTable, Column } from '../shared/DatabaseTable';
import { ScreenFormDialog } from './ScreenFormDialog';
import { ScreenImportDialog } from './ScreenImportDialog';
import { ScreenStats } from '../shared/StatsCards';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { FileDown } from 'lucide-react';

export function ScreensView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  const [deletingScreen, setDeletingScreen] = useState<Screen | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Guard — superadmin only
  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      toast.error('Access denied. Superadmin privileges required.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loadScreens = async () => {
    setLoading(true);
    const response = await inventoryService.getScreens();
    if (response.success && response.data) {
      setScreens(response.data.items);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadScreens();
  }, []);

  const handleAdd = () => {
    setEditingScreen(null);
    setFormOpen(true);
  };

  const handleEdit = (screen: Screen) => {
    setEditingScreen(screen);
    setFormOpen(true);
  };

  const handleDelete = (screen: Screen) => {
    setDeletingScreen(screen);
  };

  const confirmDelete = async () => {
    if (!deletingScreen) return;

    const response = await inventoryService.deleteScreen(deletingScreen.id);
    if (response.success) {
      toast.success('Screen deleted successfully');
      loadScreens();
    } else {
      toast.error(response.error || 'Failed to delete screen');
    }
    setDeletingScreen(null);
  };

  const handleFormSubmit = async (data: Omit<Screen, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingScreen) {
      const response = await inventoryService.updateScreen(editingScreen.id, data);
      if (response.success) {
        toast.success('Screen updated successfully');
        loadScreens();
        setFormOpen(false);
      } else {
        toast.error(response.error || 'Failed to update screen');
      }
    } else {
      const response = await inventoryService.createScreen(data);
      if (response.success) {
        toast.success('Screen added successfully');
        loadScreens();
        setFormOpen(false);
      } else {
        toast.error(response.error || 'Failed to add screen');
      }
    }
  };

  const handleImport = async (imported: Partial<Screen>[]) => {
    let successCount = 0;
    let errorCount = 0;

    for (const item of imported) {
      const response = await inventoryService.createScreen(item as Omit<Screen, 'id' | 'createdAt' | 'updatedAt'>);
      if (response.success) successCount++;
      else errorCount++;
    }

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} screen(s)`, {
        description: errorCount > 0 ? `${errorCount} failed to import` : undefined,
      });
      await loadScreens();
      setImportOpen(false);
    } else {
      toast.error('Failed to import screens');
    }
  };

  const handleExport = () => {
    if (screens.length === 0) {
      toast.error('No screens to export');
      return;
    }

    const headers = ['Screen MFR', 'Make', 'Screen Size', 'Height', 'Width', 'Depth', 'Pseudonym'];
    const rows = screens.map((s) => [
      s.manufacturer || '',
      s.model || '',
      s.sizeInInch ? `${s.sizeInInch}` : '',
      `${s.dimensions.height} ${s.dimensions.unit}`,
      `${s.dimensions.width} ${s.dimensions.unit}`,
      `${s.dimensions.depth} ${s.dimensions.unit}`,
      s.alias || '',
    ]);

    const csv = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    const blob = new Blob([csv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screens-export-${new Date().toISOString().split('T')[0]}.tsv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${screens.length} screen(s)`);
  };

  const columns: Column<Screen>[] = [
    { key: 'alias', label: 'Alias', width: '20%' },
    { key: 'model', label: 'Model', width: '15%' },
    { key: 'manufacturer', label: 'Manufacturer', width: '15%' },
    { key: 'sizeInInch', label: 'Size', render: (i) => (i.sizeInInch ? `${i.sizeInInch}"` : '-'), width: '10%' },
    { key: 'resolution', label: 'Resolution', width: '15%' },
    { key: 'panelType', label: 'Panel Type', width: '10%' },
    {
      key: 'dimensions',
      label: 'Dimensions (WxHxD)',
      render: (i) => `${i.dimensions.width} × ${i.dimensions.height} × ${i.dimensions.depth} ${i.dimensions.unit}`,
      width: '15%',
    },
  ];

  // Stats
  const uniqueManufacturers = new Set(screens.filter((s) => s.manufacturer).map((s) => s.manufacturer)).size;
  const screensWithSize = screens.filter((s) => s.sizeInInch);
  const averageSize =
    screensWithSize.length > 0 ? screensWithSize.reduce((sum, s) => sum + (s.sizeInInch || 0), 0) / screensWithSize.length : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 gap-6">
      {!loading && screens.length > 0 && (
        <ScreenStats total={screens.length} manufacturers={uniqueManufacturers} averageSize={averageSize} />
      )}

      <div className="flex-1 min-h-0">
        <DatabaseTable
          title="Screens"
          columns={columns}
          data={screens}
          loading={loading}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExport={handleExport}
          emptyMessage="No screens in database. Add your first screen to get started."
          searchPlaceholder="Search by alias, model, manufacturer..."
          headerActions={
            <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
              <FileDown className="size-4" />
              Import
            </Button>
          }
        />
      </div>

      <ScreenFormDialog open={formOpen} onOpenChange={setFormOpen} screen={editingScreen} onSubmit={handleFormSubmit} />

      <AlertDialog open={!!deletingScreen} onOpenChange={(open) => !open && setDeletingScreen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Screen</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deletingScreen?.alias}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ScreenImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} />
    </div>
  );
}
