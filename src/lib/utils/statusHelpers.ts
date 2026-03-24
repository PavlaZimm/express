import { VehicleStatus } from '@/types/fleet';

export const STATUS_LABELS: Record<VehicleStatus, string> = {
  driving:  'Jede',
  vacation: 'Dovolená',
  service:  'Servis',
  idle:     'Stojí',
};

export const STATUS_COLORS: Record<VehicleStatus, string> = {
  driving:  'bg-green-100 text-green-800 border-green-200',
  vacation: 'bg-orange-100 text-orange-800 border-orange-200',
  service:  'bg-red-100 text-red-800 border-red-200',
  idle:     'bg-gray-100 text-gray-600 border-gray-200',
};

export const STATUS_BUTTON_ACTIVE: Record<VehicleStatus, string> = {
  driving:  'bg-green-600 text-white border-green-600',
  vacation: 'bg-orange-500 text-white border-orange-500',
  service:  'bg-red-600 text-white border-red-600',
  idle:     'bg-gray-500 text-white border-gray-500',
};

export const STATUS_BUTTON_INACTIVE: Record<VehicleStatus, string> = {
  driving:  'border-green-300 text-green-700 hover:bg-green-50',
  vacation: 'border-orange-300 text-orange-700 hover:bg-orange-50',
  service:  'border-red-300 text-red-700 hover:bg-red-50',
  idle:     'border-gray-300 text-gray-600 hover:bg-gray-50',
};

export const STATUS_DOT: Record<VehicleStatus, string> = {
  driving:  'bg-green-500',
  vacation: 'bg-orange-500',
  service:  'bg-red-600',
  idle:     'bg-gray-400',
};

export const ALL_STATUSES: VehicleStatus[] = ['driving', 'vacation', 'service', 'idle'];

export function formatDuration(start: string, end: string | null): string {
  const endMs = end ? new Date(end).getTime() : Date.now();
  const ms = endMs - new Date(start).getTime();
  if (ms < 0) return '—';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hour}:${min}`;
}
