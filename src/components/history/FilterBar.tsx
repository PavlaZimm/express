'use client';

import { Search, X } from 'lucide-react';
import { HistoryFilters, VehicleStatus } from '@/types/fleet';
import { STATUS_LABELS, ALL_STATUSES } from '@/lib/utils/statusHelpers';
import { useCallback, useRef } from 'react';

const STATUS_FILTER_ACTIVE: Record<VehicleStatus, string> = {
  driving:  'bg-green-600 text-white border-green-600',
  vacation: 'bg-orange-500 text-white border-orange-500',
  service:  'bg-red-600 text-white border-red-600',
  idle:     'bg-gray-500 text-white border-gray-500',
};

interface FilterBarProps {
  filters: HistoryFilters;
  onChange: (filters: HistoryFilters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setFilter = useCallback(
    <K extends keyof HistoryFilters>(key: K, value: HistoryFilters[K]) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange]
  );

  const handleSpzInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilter('spzSearch', value);
    }, 300);
  };

  const hasActiveFilters =
    filters.statusFilter !== 'all' ||
    filters.spzSearch !== '' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.activeOnly;

  const resetFilters = () => {
    onChange({
      statusFilter: 'all',
      spzSearch: '',
      dateFrom: '',
      dateTo: '',
      activeOnly: false,
    });
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Status filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter('statusFilter', 'all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
            filters.statusFilter === 'all'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Vše
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter('statusFilter', s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              filters.statusFilter === s
                ? STATUS_FILTER_ACTIVE[s]
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* SPZ search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Hledat SPZ..."
          defaultValue={filters.spzSearch}
          onChange={handleSpzInput}
          className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
        />
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilter('dateFrom', e.target.value)}
          className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-400 text-sm">—</span>
        <input
          type="date"
          value={filters.dateTo}
          min={filters.dateFrom}
          onChange={(e) => setFilter('dateTo', e.target.value)}
          className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Active only checkbox */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filters.activeOnly}
          onChange={(e) => setFilter('activeOnly', e.target.checked)}
          className="w-4 h-4 accent-blue-600"
        />
        <span className="text-sm text-gray-600">Aktivní</span>
      </label>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Reset
        </button>
      )}
    </div>
  );
}
