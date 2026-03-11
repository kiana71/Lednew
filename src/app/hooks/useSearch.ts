/**
 * Custom Hook for Search Functionality
 * 
 * Manages search state and debouncing for optimal performance
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SearchFilters } from '../types';

interface UseSearchOptions {
  debounceMs?: number;
  onSearch?: (filters: SearchFilters) => void;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { debounceMs = 300, onSearch } = options;

  const [filters, setFilters] = useState<SearchFilters>({});
  const [debouncedFilters, setDebouncedFilters] = useState<SearchFilters>({});
  const [isSearching, setIsSearching] = useState(false);
  
  // Use a ref to avoid dependency issues
  const onSearchRef = useRef(onSearch);
  
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Debounce filter changes
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
      setIsSearching(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [filters, debounceMs]);

  // Trigger search when debounced filters change
  useEffect(() => {
    // Only trigger search if there are active filters or it's not the initial empty state
    const hasFilters = Object.keys(debouncedFilters).some(key => {
      const value = debouncedFilters[key as keyof SearchFilters];
      return value !== undefined && value !== null;
    });
    
    if (onSearchRef.current && hasFilters) {
      onSearchRef.current(debouncedFilters);
    }
  }, [debouncedFilters]);

  const setQuery = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, query: query || undefined }));
  }, []);

  const setDateRange = useCallback((start: Date | null, end: Date | null) => {
    setFilters(prev => ({
      ...prev,
      dateRange: start && end ? { start, end } : undefined,
    }));
  }, []);

  const setCreatedBy = useCallback((userIds: string[]) => {
    setFilters(prev => ({
      ...prev,
      createdBy: userIds.length > 0 ? userIds : undefined,
    }));
  }, []);

  const setStatus = useCallback((statuses: SearchFilters['status']) => {
    setFilters(prev => ({
      ...prev,
      status: statuses && statuses.length > 0 ? statuses : undefined,
    }));
  }, []);

  const setTags = useCallback((tags: string[]) => {
    setFilters(prev => ({
      ...prev,
      tags: tags.length > 0 ? tags : undefined,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof SearchFilters];
    return value !== undefined && value !== null;
  });

  return {
    filters,
    debouncedFilters,
    isSearching,
    setQuery,
    setDateRange,
    setCreatedBy,
    setStatus,
    setTags,
    clearFilters,
    hasActiveFilters,
  };
}