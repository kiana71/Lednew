/**
 * Company Name Combobox
 *
 * Reusable autocomplete picker that loads company names from the
 * DataService. Supports searching, selecting an existing company,
 * creating a new one on the fly, and clearing the selection.
 *
 * Used in EditDrawingPane (Client Name), CreateUserDialog, and
 * EditUserDialog (Company Name).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Button } from '../ui/button';
import { Building2, Search, X, Check, Plus } from 'lucide-react';
import { dataService } from '../../services/DataService';

interface CompanyComboboxProps {
  /** Currently selected company name (controlled) */
  value: string;
  /** Called when the value changes */
  onChange: (value: string) => void;
  /** Placeholder shown when nothing is selected */
  placeholder?: string;
  /** Additional class names for the trigger button */
  className?: string;
  /** Optional HTML id for the trigger */
  id?: string;
}

export function CompanyCombobox({
  value,
  onChange,
  placeholder = 'Select or add...',
  className,
  id,
}: CompanyComboboxProps) {
  const [open, setOpen] = useState(false);
  const [companyNames, setCompanyNames] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Load company names when the popover opens
  useEffect(() => {
    if (open) {
      dataService.getCompanyNames().then((res) => {
        if (res.success && res.data) setCompanyNames(res.data);
      });
    }
  }, [open]);

  // Focus the search input when the popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [open]);

  const filtered = companyNames.filter(
    (c) => !search.trim() || c.toLowerCase().includes(search.toLowerCase()),
  );

  const searchTrimmed = search.trim();
  const showCreate =
    searchTrimmed.length > 0 &&
    !companyNames.some((c) => c.toLowerCase() === searchTrimmed.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          id={id}
          className={`w-full justify-between h-9 text-left ${className ?? ''}`}
        >
          {value ? (
            <span className="flex items-center gap-2 truncate">
              <Building2 className="size-4 text-muted-foreground shrink-0" />
              <span className="truncate">{value}</span>
            </span>
          ) : (
            <span className="text-muted-foreground flex items-center gap-2">
              <Building2 className="size-4" />
              {placeholder}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
      >
        {/* Search input */}
        <div className="flex items-center border-b px-3 py-2">
          <Search className="size-4 text-muted-foreground mr-2 shrink-0" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies..."
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Options */}
        <div className="max-h-48 overflow-y-auto">
          <div className="p-1.5 space-y-0.5">
            {filtered.map((c) => (
              <button
                key={c}
                type="button"
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  value === c
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
              >
                <Building2 className="size-4 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{c}</span>
                {value === c && (
                  <Check className="size-4 text-muted-foreground shrink-0" />
                )}
              </button>
            ))}

            {/* Create option for typed value not in list */}
            {showCreate && (
              <button
                type="button"
                className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-md text-sm hover:bg-accent/50"
                onClick={() => {
                  const newName = searchTrimmed;
                  onChange(newName);
                  setCompanyNames((prev) => [...prev, newName].sort());
                  setOpen(false);
                }}
              >
                <Plus className="size-4 text-muted-foreground shrink-0" />
                <span>
                  Create &ldquo;{searchTrimmed}&rdquo;
                </span>
              </button>
            )}

            {/* Empty state */}
            {filtered.length === 0 && !searchTrimmed && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                No companies yet
              </p>
            )}
          </div>
        </div>

        {/* Clear button */}
        {value && (
          <div className="border-t px-3 py-2">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              Clear selection
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
