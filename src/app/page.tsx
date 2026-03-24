import { Truck } from 'lucide-react';
import { getSupabaseServer } from '@/lib/supabase/server';
import { VehicleGrid } from '@/components/dashboard/VehicleGrid';
import { HistoryTable } from '@/components/history/HistoryTable';
import { Vehicle, FleetHistory } from '@/types/fleet';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = getSupabaseServer();

  const [{ data: vehicles }, { data: history }] = await Promise.all([
    supabase.from('vehicles').select('*').order('spz'),
    supabase
      .from('fleet_history')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(500),
  ]);

  const safeVehicles = (vehicles as Vehicle[]) ?? [];
  const safeHistory = (history as FleetHistory[]) ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <Truck className="w-4 h-4" />
            </div>
            <span className="font-semibold text-gray-900 text-base">Fleet Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Realtime</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Vehicle grid section */}
        <section>
          <VehicleGrid initialVehicles={safeVehicles} />
        </section>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* History table section */}
        <section className="pb-8">
          <HistoryTable initialHistory={safeHistory} />
        </section>
      </main>
    </div>
  );
}
