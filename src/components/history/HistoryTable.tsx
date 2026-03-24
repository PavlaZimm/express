'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { FleetHistory } from '@/types/fleet';
import { useFleetHistory } from '@/lib/hooks/useFleetHistory';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { FilterBar } from './FilterBar';
import { ExportButton } from './ExportButton';
import { formatDuration, formatDateTime } from '@/lib/utils/statusHelpers';

const PAGE_SIZE = 25;

interface HistoryTableProps {
  initialHistory: FleetHistory[];
}

export function HistoryTable({ initialHistory }: HistoryTableProps) {
  const { history, filters, setFilters, loading } = useFleetHistory(initialHistory);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = history.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to page 1 when filters change
  const handleFiltersChange = (newFilters: typeof filters) => {
    setPage(1);
    setFilters(newFilters);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Historie jízd</h2>
          {loading && (
            <span className="text-xs text-gray-400 animate-pulse">načítám…</span>
          )}
        </div>
        <ExportButton rows={history} />
      </div>

      {/* Filters */}
      <FilterBar filters={filters} onChange={handleFiltersChange} />

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SPZ</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Začátek</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Konec</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trvání</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                  {loading ? 'Načítám…' : 'Žádné záznamy'}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-900">
                    {row.spz}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} size="sm" showDot={!row.end_time} />
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {formatDateTime(row.start_time)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {row.end_time ? (
                      formatDateTime(row.end_time)
                    ) : (
                      <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Aktivní
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 tabular-nums">
                    {formatDuration(row.start_time, row.end_time)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, history.length)} z {history.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
