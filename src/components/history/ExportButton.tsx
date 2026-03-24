'use client';

import { Download } from 'lucide-react';
import { FleetHistory } from '@/types/fleet';
import { exportToCSV } from '@/lib/utils/csvExport';

interface ExportButtonProps {
  rows: FleetHistory[];
}

export function ExportButton({ rows }: ExportButtonProps) {
  return (
    <button
      onClick={() => exportToCSV(rows)}
      disabled={rows.length === 0}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <Download className="w-4 h-4" />
      Export CSV ({rows.length})
    </button>
  );
}
