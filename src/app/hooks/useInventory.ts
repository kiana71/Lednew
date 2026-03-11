/**
 * Custom Hook for Dashboard Inventory Management
 *
 * Encapsulates inventory count loading and quick-add form submission
 * for all four inventory types (screens, mounts, media players, receptacle boxes).
 */

import { useState, useEffect, useCallback } from 'react';
import { Screen, Mount, MediaPlayer, ReceptacleBox } from '../types';
import { inventoryService } from '../services/InventoryService';
import { toast } from 'sonner';

export type InventoryType = 'screen' | 'mount' | 'mediaPlayer' | 'receptacleBox';

interface InventoryCounts {
  screens: number;
  mounts: number;
  mediaPlayers: number;
  receptacleBoxes: number;
}

export function useInventory() {
  const [inventoryFormOpen, setInventoryFormOpen] = useState<InventoryType | null>(null);
  const [inventoryCounts, setInventoryCounts] = useState<InventoryCounts>({
    screens: 0,
    mounts: 0,
    mediaPlayers: 0,
    receptacleBoxes: 0,
  });
  const [countsLoading, setCountsLoading] = useState(true);

  const loadInventoryCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const [screensRes, mountsRes, playersRes, boxesRes] = await Promise.all([
        inventoryService.getScreens(),
        inventoryService.getMounts(),
        inventoryService.getMediaPlayers(),
        inventoryService.getReceptacleBoxes(),
      ]);

      setInventoryCounts({
        screens: screensRes.data?.total ?? 0,
        mounts: mountsRes.data?.total ?? 0,
        mediaPlayers: playersRes.data?.total ?? 0,
        receptacleBoxes: boxesRes.data?.total ?? 0,
      });
    } catch {
      // Silently fail — widgets show 0
    }
    setCountsLoading(false);
  }, []);

  useEffect(() => {
    loadInventoryCounts();
  }, [loadInventoryCounts]);

  const totalInventory =
    inventoryCounts.screens +
    inventoryCounts.mounts +
    inventoryCounts.mediaPlayers +
    inventoryCounts.receptacleBoxes;

  // ---- Quick-add handlers ----

  const handleScreenSubmit = async (data: Omit<Screen, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await inventoryService.createScreen(data);
    if (response.success) {
      toast.success(`Screen "${data.alias}" added to inventory`);
      setInventoryFormOpen(null);
      loadInventoryCounts();
    } else {
      toast.error(response.error || 'Failed to add screen');
    }
  };

  const handleMountSubmit = async (data: Omit<Mount, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await inventoryService.createMount(data);
    if (response.success) {
      toast.success(`Mount "${data.alias}" added to inventory`);
      setInventoryFormOpen(null);
      loadInventoryCounts();
    } else {
      toast.error(response.error || 'Failed to add mount');
    }
  };

  const handleMediaPlayerSubmit = async (data: Omit<MediaPlayer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await inventoryService.createMediaPlayer(data);
    if (response.success) {
      toast.success(`Media Player "${data.alias}" added to inventory`);
      setInventoryFormOpen(null);
      loadInventoryCounts();
    } else {
      toast.error(response.error || 'Failed to add media player');
    }
  };

  const handleReceptacleBoxSubmit = async (data: Omit<ReceptacleBox, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await inventoryService.createReceptacleBox(data);
    if (response.success) {
      toast.success(`Receptacle Box "${data.alias}" added to inventory`);
      setInventoryFormOpen(null);
      loadInventoryCounts();
    } else {
      toast.error(response.error || 'Failed to add receptacle box');
    }
  };

  return {
    inventoryCounts,
    countsLoading,
    totalInventory,
    inventoryFormOpen,
    setInventoryFormOpen,
    handleScreenSubmit,
    handleMountSubmit,
    handleMediaPlayerSubmit,
    handleReceptacleBoxSubmit,
  };
}
