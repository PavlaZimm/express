'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Vehicle, VehicleStatus } from '@/types/fleet';

export function useVehicles(initialVehicles: Vehicle[]) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return; // env vars not configured

    const channel = supabase
      .channel('vehicles-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'vehicles' },
        (payload) => {
          setVehicles((prev) =>
            prev.map((v) =>
              v.id === payload.new.id ? (payload.new as Vehicle) : v
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = useCallback(
    async (vehicleId: string, newStatus: VehicleStatus) => {
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle || vehicle.status === newStatus) return;

      // Optimistic update
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, status: newStatus } : v))
      );
      setUpdating((prev) => new Set(prev).add(vehicleId));

      const supabase = getSupabaseClient();
      if (!supabase) {
        // No Supabase — keep optimistic update for demo purposes
        setUpdating((prev) => { const n = new Set(prev); n.delete(vehicleId); return n; });
        return;
      }

      try {
        // 1) Close any open history record for this vehicle
        await supabase
          .from('fleet_history')
          .update({ end_time: new Date().toISOString() })
          .eq('vehicle_id', vehicleId)
          .is('end_time', null);

        // 2) Open a new history record
        await supabase.from('fleet_history').insert({
          vehicle_id: vehicleId,
          spz: vehicle.spz,
          status: newStatus,
          start_time: new Date().toISOString(),
        });

        // 3) Update the live vehicle status
        const { error } = await supabase
          .from('vehicles')
          .update({ status: newStatus })
          .eq('id', vehicleId);

        if (error) throw error;
      } catch (err) {
        console.error('Chyba při aktualizaci statusu:', err);
        // Revert optimistic update on error
        setVehicles((prev) =>
          prev.map((v) =>
            v.id === vehicleId ? { ...v, status: vehicle.status } : v
          )
        );
      } finally {
        setUpdating((prev) => {
          const next = new Set(prev);
          next.delete(vehicleId);
          return next;
        });
      }
    },
    [vehicles]
  );

  return { vehicles, updateStatus, updating };
}
