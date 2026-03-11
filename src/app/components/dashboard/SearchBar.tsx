/**
 * Search Bar Component
 *
 * Real-time search input that instantly filters the main drawing list.
 * Includes date range and status (all / done / pending) filters inside
 * a single "Filters" popover.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Search, Filter, X, Calendar, Loader2 } from 'lucide-react';
import { SearchFilters } from '../../types';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { format } from 'date-fns';
import { cn } from '../ui/utils';

type StatusFilter = 'all' | 'pending' | 'done';

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  isSearching?: boolean;
  /** Current status filter value */
  statusFilter?: StatusFilter;
  /** Called when user picks a status inside the filter popover */
  onStatusFilterChange?: (status: StatusFilter) => void;
}

export function SearchBar({
  onSearch,
  isSearching,
  statusFilter = 'all',
  onStatusFilterChange,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Debounced search — fires on every keystroke after short delay ──────

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      const filters: SearchFilters = {
        query: query.trim() || undefined,
        dateRange:
          dateRange.start && dateRange.end
            ? { start: dateRange.start, end: dateRange.end }
            : undefined,
      };

      onSearch(filters);
    }, 150);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, dateRange]);

  // ── Helpers ───────────────────────────────────────────────────────────

  const clearAll = () => {
    setQuery('');
    setDateRange({ start: null, end: null });
    onStatusFilterChange?.('all');
  };

  const hasDateFilter = !!(dateRange.start && dateRange.end);
  const hasStatusFilter = statusFilter !== 'all';

  const activeFilterCount = (hasDateFilter ? 1 : 0) + (hasStatusFilter ? 1 : 0);

  const hasAnything = !!query || activeFilterCount > 0;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          {isSearching && query.trim() ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          ) : null}
          <Input
            ref={inputRef}
            placeholder="Search by drawing number, title, client, description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-9"
          />
        </div>

        {/* Filter button */}
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative gap-2">
              <Filter className="size-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <Badge
                  variant="default"
                  className="ml-1 size-5 rounded-full p-0 flex items-center justify-center"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="space-y-5">
              <h4 className="font-medium">Filter Options</h4>

              {/* Status filter */}
              <div className="space-y-2.5">
                <Label className="text-sm">Status</Label>
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
                  {(['all', 'done', 'pending'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => onStatusFilterChange?.(tab)}
                      className={cn(
                        'flex-1 px-3 py-1.5 rounded-md text-sm transition-colors',
                        statusFilter === tab
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100',
                      )}
                    >
                      {tab === 'all' ? 'All' : tab === 'done' ? 'Done' : 'Pending'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div className="space-y-2.5">
                <Label className="text-sm">Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <Calendar className="mr-2 size-4" />
                      {dateRange.start && dateRange.end ? (
                        <>
                          {format(dateRange.start, 'PP')} – {format(dateRange.end, 'PP')}
                        </>
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3 space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">Start Date</p>
                        <CalendarComponent
                          mode="single"
                          selected={dateRange.start || undefined}
                          onSelect={(date) =>
                            setDateRange((prev) => ({ ...prev, start: date || null }))
                          }
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">End Date</p>
                        <CalendarComponent
                          mode="single"
                          selected={dateRange.end || undefined}
                          onSelect={(date) =>
                            setDateRange((prev) => ({ ...prev, end: date || null }))
                          }
                          disabled={(date) =>
                            dateRange.start ? date < dateRange.start : false
                          }
                        />
                      </div>
                      {(dateRange.start || dateRange.end) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setDateRange({ start: null, end: null })}
                        >
                          Clear dates
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Footer */}
              <div className="flex gap-2 pt-1">
                {activeFilterCount > 0 && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setDateRange({ start: null, end: null });
                      onStatusFilterChange?.('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
                <Button className="flex-1" onClick={() => setShowFilters(false)}>
                  Done
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active filter badges */}
      {hasAnything && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Active:</span>
          {query && (
            <Badge variant="secondary" className="gap-1 text-xs">
              Search: &ldquo;{query}&rdquo;
              <X
                className="size-3 cursor-pointer"
                onClick={() => setQuery('')}
              />
            </Badge>
          )}
          {hasStatusFilter && (
            <Badge variant="secondary" className="gap-1 text-xs">
              Status: {statusFilter === 'done' ? 'Done' : 'Pending'}
              <X
                className="size-3 cursor-pointer"
                onClick={() => onStatusFilterChange?.('all')}
              />
            </Badge>
          )}
          {hasDateFilter && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {format(dateRange.start!, 'PP')} – {format(dateRange.end!, 'PP')}
              <X
                className="size-3 cursor-pointer"
                onClick={() => setDateRange({ start: null, end: null })}
              />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 text-xs px-2">
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
