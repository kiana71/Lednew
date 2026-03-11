/**
 * Hook: useDrawingInventory
 *
 * Loads all inventory items (screens, mounts, media players, receptacle boxes)
 * from the InventoryService for use as dropdown options in the drawing builder.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Screen, Mount, MediaPlayer, ReceptacleBox } from '../types';
import { inventoryService } from '../services/InventoryService';

interface UseDrawingInventoryReturn {
  screens: Screen[];
  mounts: Mount[];
  mediaPlayers: MediaPlayer[];
  receptacleBoxes: ReceptacleBox[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDrawingInventory(): UseDrawingInventoryReturn {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [mounts, setMounts] = useState<Mount[]>([]);
  const [mediaPlayers, setMediaPlayers] = useState<MediaPlayer[]>([]);
  const [receptacleBoxes, setReceptacleBoxes] = useState<ReceptacleBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, mRes, mpRes, rbRes] = await Promise.all([
        inventoryService.getScreens(),
        inventoryService.getMounts(),
        inventoryService.getMediaPlayers(),
        inventoryService.getReceptacleBoxes(),
      ]);

      setScreens(sRes.data?.items ?? []);
      setMounts(mRes.data?.items ?? []);
      setMediaPlayers(mpRes.data?.items ?? []);
      setReceptacleBoxes(rbRes.data?.items ?? []);
    } catch {
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return { screens, mounts, mediaPlayers, receptacleBoxes, loading, error, refresh: loadAll };
}
