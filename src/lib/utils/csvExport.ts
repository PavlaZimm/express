import { FleetHistory } from '@/types/fleet';
import { STATUS_LABELS, formatDuration, formatDateTime } from './statusHelpers';

function escapeCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function exportToCSV(rows: FleetHistory[], filename = 'fleet_history'): void {
  const headers = ['SPZ', 'Status', 'Začátek', 'Konec', 'Trvání'];

  const csvRows = rows.map((row) => [
    row.spz,
    STATUS_LABELS[row.status] ?? row.status,
    formatDateTime(row.start_time),
    row.end_time ? formatDateTime(row.end_time) : 'Aktivní',
    formatDuration(row.start_time, row.end_time),
  ]);

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...csvRows.map((r) => r.map(escapeCell).join(',')),
  ].join('\r\n');

  const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
