/**
 * Generic Database Table Component
 * 
 * Full-height table with sticky header, internal scroll,
 * and infinite lazy loading via IntersectionObserver.
 *
 * Shared across Screens, Mounts, Media Players, and Receptacle Boxes views.
 */

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Edit,
  Trash2,
  Plus,
  Search,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  ChevronsUp,
} from 'lucide-react';
import { cn } from '../ui/utils';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
  sortable?: boolean;
}

interface DatabaseTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onAdd?: () => void;
  title: string;
  emptyMessage?: string;
  headerActions?: React.ReactNode;
  searchPlaceholder?: string;
  onExport?: () => void;
}

type SortDirection = 'asc' | 'desc' | null;

const BATCH_SIZE = 50;

export function DatabaseTable<T extends { id: string }>({
  columns,
  data,
  loading,
  onEdit,
  onDelete,
  onAdd,
  title,
  emptyMessage = 'No items found',
  headerActions,
  searchPlaceholder = 'Search...',
  onExport,
}: DatabaseTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = data.filter((item) => {
        return columns.some((column) => {
          const value = (item as any)[column.key];
          if (value == null) return false;
          return value.toString().toLowerCase().includes(query);
        });
      });
    }

    if (sortKey && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = (a as any)[sortKey];
        const bValue = (b as any)[sortKey];

        if (aValue == null) return 1;
        if (bValue == null) return -1;

        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchQuery, sortKey, sortDirection, columns]);

  // Slice visible data for lazy loading
  const visibleData = useMemo(
    () => processedData.slice(0, visibleCount),
    [processedData, visibleCount]
  );

  const hasMore = visibleCount < processedData.length;

  // Reset visible count when search/sort/data changes
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [searchQuery, sortKey, sortDirection, data]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          requestAnimationFrame(() => {
            setTimeout(() => {
              setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, processedData.length));
              setIsLoadingMore(false);
            }, 120);
          });
        }
      },
      {
        root: container,
        rootMargin: '200px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, processedData.length]);

  // Show/hide scroll-to-top based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 300);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSort = (columnKey: string) => {
    if (sortKey === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(columnKey);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="size-3 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="size-3" />
    ) : (
      <ArrowDown className="size-3" />
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="animate-pulse space-y-4">
            <div className="h-7 bg-slate-200 rounded w-1/4"></div>
            <div className="h-9 bg-slate-100 rounded"></div>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="h-11 bg-slate-50 rounded" style={{ opacity: 1 - i * 0.06 }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full flex flex-col overflow-hidden relative">
      {/* Header — pinned */}
      <div className="flex-shrink-0 p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {processedData.length} {processedData.length === 1 ? 'item' : 'items'}
              {searchQuery && processedData.length !== data.length && (
                <span className="text-slate-400"> (filtered from {data.length})</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            {onExport && data.length > 0 && (
              <Button variant="outline" onClick={onExport} className="gap-2">
                <Download className="size-4" />
                Export
              </Button>
            )}
            {onAdd && (
              <Button onClick={onAdd} className="gap-2">
                <Plus className="size-4" />
                Add New
              </Button>
            )}
          </div>
        </div>

        {data.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </div>

      {/* Table — scrolls internally */}
      {processedData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="text-center">
            {searchQuery ? (
              <>
                <p className="text-slate-500">No results found for &quot;{searchQuery}&quot;</p>
                <Button variant="outline" onClick={() => setSearchQuery('')} className="mt-4">
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <p className="text-slate-500 mb-2">{emptyMessage}</p>
                {onAdd && (
                  <Button onClick={onAdd} variant="outline" className="gap-2">
                    <Plus className="size-4" />
                    Add First Item
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-[2]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50',
                      column.sortable !== false && 'cursor-pointer select-none hover:bg-slate-100'
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable !== false && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-28 bg-slate-50">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-3.5 text-sm text-slate-900">
                      {column.render
                        ? column.render(item)
                        : (item as any)[column.key]?.toString() || '-'}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-3.5 text-sm text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(item)}
                            className="h-8 w-8 p-0 hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit className="size-4 text-slate-600" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(item)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Sentinel for infinite scroll + loading indicator */}
          <div ref={sentinelRef} className="h-px" />
          {isLoadingMore && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-400">
              <Loader2 className="size-4 animate-spin" />
              Loading more...
            </div>
          )}

          {/* All loaded indicator */}
          {!hasMore && processedData.length > BATCH_SIZE && (
            <div className="flex items-center justify-center py-3 text-xs text-slate-400">
              All {processedData.length} items loaded
            </div>
          )}
        </div>
      )}

      {/* Footer bar with count */}
      {processedData.length > 0 && (
        <div className="flex-shrink-0 px-6 py-2.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing {visibleData.length} of {processedData.length} items
          </p>
          {hasMore && (
            <p className="text-xs text-slate-400">Scroll for more</p>
          )}
        </div>
      )}

      {/* Floating scroll-to-top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className={cn(
            'absolute bottom-12 right-4 z-10 flex items-center justify-center',
            'h-8 w-8 rounded-full bg-slate-900/80 text-white shadow-md',
            'hover:bg-slate-900 transition-all duration-200',
          )}
          title="Scroll to top"
        >
          <ChevronsUp className="size-4" />
        </button>
      )}
    </div>
  );
}
