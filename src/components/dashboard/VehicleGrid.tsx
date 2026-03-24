'use client';

import { useVehicles } from '@/lib/hooks/useVehicles';
import { VehicleCard } from './VehicleCard';
import { Vehicle } from '@/types/fleet';

interface VehicleGridProps {
  initialVehicles: Vehicle[];
}

export function VehicleGrid({ initialVehicles }: VehicleGridProps) {
  const { vehicles, updateStatus, updating } = useVehicles(initialVehicles);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Přehled vozidel</h2>
        <span className="text-sm text-gray-500">{vehicles.length} vozidel</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            isUpdating={updating.has(vehicle.id)}
            onStatusChange={updateStatus}
          />
        ))}
      </div>
    </div>
  );
}
