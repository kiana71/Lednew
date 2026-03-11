/**
 * Custom Hook for Drawing Management
 * 
 * Provides drawing-related operations and state management
 * Follows Single Responsibility Principle
 */

import { useState, useEffect, useCallback } from 'react';
import { Drawing, SearchFilters, PaginationParams, SearchResult } from '../types';
import { dataService } from '../services/DataService';

interface UseDrawingsOptions {
  autoLoad?: boolean;
  initialPageSize?: number;
}

export function useDrawings(options: UseDrawingsOptions = {}) {
  const { autoLoad = true, initialPageSize = 12 } = options;

  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    pageSize: initialPageSize,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  const loadDrawings = useCallback(async (filters?: SearchFilters) => {
    try {
      setLoading(true);
      setSearching(!!filters);
      setError(null);

      const response = filters
        ? await dataService.searchDrawings(filters, pagination)
        : await dataService.getDrawings(pagination);

      if (response.success && response.data) {
        setDrawings(response.data.items);
        setTotal(response.data.total);
      } else {
        setError(response.error || 'Failed to load drawings');
      }
    } catch (err) {
      console.error('Error loading drawings:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [pagination.page, pagination.pageSize, pagination.sortBy, pagination.sortOrder]);

  const createDrawing = useCallback(
    async (drawing: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt' | 'drawingNumber'>) => {
      try {
        setLoading(true);
        setError(null);

        const response = await dataService.createDrawing(drawing);

        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.error || 'Failed to create drawing');
          return null;
        }
      } catch (err) {
        console.error('Error creating drawing:', err);
        setError('An unexpected error occurred');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateDrawing = useCallback(
    async (id: string, updates: Partial<Drawing>) => {
      try {
        setLoading(true);
        setError(null);

        const response = await dataService.updateDrawing(id, updates);

        if (response.success && response.data) {
          // Update local state
          setDrawings(prev =>
            prev.map(d => (d.id === id ? response.data! : d))
          );
          return response.data;
        } else {
          setError(response.error || 'Failed to update drawing');
          return null;
        }
      } catch (err) {
        console.error('Error updating drawing:', err);
        setError('An unexpected error occurred');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteDrawing = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await dataService.deleteDrawing(id);

        if (response.success) {
          // Remove from local state
          setDrawings(prev => prev.filter(d => d.id !== id));
          setTotal(prev => prev - 1);
          return true;
        } else {
          setError(response.error || 'Failed to delete drawing');
          return false;
        }
      } catch (err) {
        console.error('Error deleting drawing:', err);
        setError('An unexpected error occurred');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const duplicateDrawing = useCallback(
    async (drawing: Drawing) => {
      try {
        setLoading(true);
        setError(null);

        // Create a copy of the drawing with updated metadata
        const duplicatedDrawing: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt' | 'drawingNumber'> = {
          title: `${drawing.title} (Copy)`,
          description: drawing.description,
          createdBy: drawing.createdBy,
          createdByName: drawing.createdByName,
          thumbnailUrl: drawing.thumbnailUrl,
          metadata: drawing.metadata,
          canvasData: drawing.canvasData,
          tags: drawing.tags,
          status: 'draft',
        };

        const response = await dataService.createDrawing(duplicatedDrawing);

        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.error || 'Failed to duplicate drawing');
          return null;
        }
      } catch (err) {
        console.error('Error duplicating drawing:', err);
        setError('An unexpected error occurred');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const searchDrawings = useCallback(
    async (filters: SearchFilters) => {
      // Check if there are actual filters to apply
      const hasFilters = Object.keys(filters).some(key => {
        const value = filters[key as keyof SearchFilters];
        return value !== undefined && value !== null;
      });

      try {
        setSearching(true);
        setError(null);

        const response = hasFilters
          ? await dataService.searchDrawings(filters, pagination)
          : await dataService.getDrawings(pagination);

        if (response.success && response.data) {
          setDrawings(response.data.items);
          setTotal(response.data.total);
        } else {
          setError(response.error || 'Failed to load drawings');
        }
      } catch (err) {
        console.error('Error searching drawings:', err);
        setError('An unexpected error occurred');
      } finally {
        setSearching(false);
      }
    },
    [pagination]
  );

  const changePage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const changePageSize = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const changeSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setPagination(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
  }, []);

  // Auto-load on mount or when pagination changes
  useEffect(() => {
    if (autoLoad) {
      loadDrawings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, pagination.page, pagination.pageSize, pagination.sortBy, pagination.sortOrder]);

  return {
    drawings,
    total,
    loading,
    searching,
    error,
    pagination,
    loadDrawings,
    createDrawing,
    updateDrawing,
    deleteDrawing,
    duplicateDrawing,
    searchDrawings,
    changePage,
    changePageSize,
    changeSort,
    refresh: loadDrawings,
  };
}

/**
 * Hook for fetching a single drawing
 */
export function useDrawing(id: string | null) {
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [loading, setLoading] = useState(!!id); // Start loading when there's an id
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setDrawing(null);
      setLoading(false);
      return;
    }

    const loadDrawing = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await dataService.getDrawingById(id);

        if (response.success && response.data) {
          setDrawing(response.data);
        } else {
          setError(response.error || 'Drawing not found');
        }
      } catch (err) {
        console.error('Error loading drawing:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadDrawing();
  }, [id]);

  return { drawing, loading, error };
}