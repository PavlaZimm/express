import { VehicleStatus } from '@/types/fleet';
import { STATUS_COLORS, STATUS_LABELS, STATUS_DOT } from '@/lib/utils/statusHelpers';

interface StatusBadgeProps {
  status: VehicleStatus;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export function StatusBadge({ status, size = 'md', showDot = false }: StatusBadgeProps) {
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeClasses} ${STATUS_COLORS[status]}`}
    >
      {showDot && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]} ${
            status === 'service' ? 'animate-pulse' : ''
          }`}
        />
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}
