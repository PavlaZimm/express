'use client';

import { Car, Loader2 } from 'lucide-react';
import { Vehicle, VehicleStatus } from '@/types/fleet';
import {
  STATUS_LABELS,
  STATUS_BUTTON_ACTIVE,
  STATUS_BUTTON_INACTIVE,
  STATUS_DOT,
  ALL_STATUSES,
} from '@/lib/utils/statusHelpers';

interface VehicleCardProps {
  vehicle: Vehicle;
  isUpdating: boolean;
  onStatusChange: (vehicleId: string, status: VehicleStatus) => void;
}

export function VehicleCard({ vehicle, isUpdating, onStatusChange }: VehicleCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3 transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${STATUS_DOT[vehicle.status]} ${vehicle.status === 'service' ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Vozidlo</span>
        </div>
        {isUpdating ? (
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        ) : (
          <Car className="w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* License plate + driver */}
      <div className="text-center">
        <span className="font-mono text-xl font-bold text-gray-900 tracking-widest">
          {vehicle.spz}
        </span>
        {vehicle.driver_name && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{vehicle.driver_name}</p>
        )}
      </div>

      {/* Status buttons */}
      <div className="grid grid-cols-2 gap-1.5">
        {ALL_STATUSES.map((s) => {
          const isActive = vehicle.status === s;
          return (
            <button
              key={s}
              onClick={() => !isUpdating && onStatusChange(vehicle.id, s)}
              disabled={isUpdating || isActive}
              className={`text-xs font-medium px-2 py-1.5 rounded-lg border transition-all ${
                isActive
                  ? STATUS_BUTTON_ACTIVE[s]
                  : `${STATUS_BUTTON_INACTIVE[s]} cursor-pointer`
              } disabled:cursor-not-allowed`}
            >
              {STATUS_LABELS[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
