'use client';

import { ProductStatus } from '@/types';
import { Search, ChevronDown } from 'lucide-react';

interface FilterBarProps {
  status: ProductStatus | 'ALL';
  onStatusChange: (status: ProductStatus | 'ALL') => void;
  search: string;
  onSearchChange: (search: string) => void;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  selectedCount?: number;
  onDeselectAll?: () => void;
}

const statusOptions: { value: ProductStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'POSTED', label: 'Posted' },
  { value: 'FAILED', label: 'Failed' },
];

const sortOptions = [
  { value: 'createdAt-desc', label: 'Newest' },
  { value: 'createdAt-asc', label: 'Oldest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

export function FilterBar({
  status,
  onStatusChange,
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  selectedCount,
  onDeselectAll,
}: FilterBarProps) {
  return (
    <div className="sticky top-0 z-20 bg-bg-primary border-b border-border space-y-4 pb-4">
      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
              ${status === option.value
                ? 'bg-accent text-white'
                : 'bg-bg-surface text-text-secondary hover:bg-bg-card hover:text-text-primary'
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Search and Sort */}
      <div className="flex gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none bg-bg-surface border border-border rounded-md px-4 py-2 pr-10 text-text-primary focus:outline-none focus:border-accent cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
        </div>

        {/* Deselect All Button */}
        {selectedCount !== undefined && selectedCount > 0 && onDeselectAll && (
          <button
            onClick={onDeselectAll}
            className="px-4 py-2 bg-danger/20 text-danger rounded-md text-sm font-medium hover:bg-danger/30 transition-colors"
          >
            Deselect All
          </button>
        )}
      </div>
    </div>
  );
}
