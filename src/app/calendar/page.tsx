import { Truck } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase/server';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { Vehicle, FleetHistory } from '@/types/fleet';
import { getWeekStart } from '@/lib/utils/calendarHelpers';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isConfigured = !!(supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id'));

  const demoVehicles: Vehicle[] = [
    { id: '1', spz: '6SM7428', type: 'dodávka', driver_name: null, status: 'idle' },
    { id: '2', spz: '6SM7429', type: 'dodávka', driver_name: null, status: 'idle' },
    { id: '3', spz: '1UZ 1408', type: 'kamion', driver_name: null, status: 'idle' },
    { id: '4', spz: '1UZ 8160', type: 'kamion', driver_name: null, status: 'idle' },
    { id: '5', spz: '1UZ 8168', type: 'kamion', driver_name: null, status: 'idle' },
    { id: '6', spz: '1U7 8413', type: 'kamion', driver_name: null, status: 'idle' },
  ];

  let vehicles: Vehicle[] = demoVehicles;
  let history: FleetHistory[] = [];

  if (isConfigured) {
    const supabase = getSupabaseServer();

    // Fetch current week's history for SSR
    const weekStart = getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const fromStr = fmt(weekStart);
    const toStr = fmt(weekEnd);

    const [{ data: v }, { data: h }] = await Promise.all([
      supabase.from('vehicles').select('*').order('spz'),
      supabase
        .from('fleet_history')
        .select('*')
        .lte('start_time', `${toStr}T23:59:59.999Z`)
        .or(`end_time.gte.${fromStr}T00:00:00Z,end_time.is.null`)
        .order('start_time', { ascending: true }),
    ]);

    vehicles = (v as Vehicle[]) ?? demoVehicles;
    history = (h as FleetHistory[]) ?? [];
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <Truck className="w-4 h-4" />
            </div>
            <span className="font-semibold text-gray-900 text-base">Fleet Dashboard</span>
          </div>
          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-1.5 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/calendar"
              className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg"
            >
              Kalendář
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-10">
        <CalendarGrid initialVehicles={vehicles} initialHistory={history} />
      </main>
    </div>
  );
}
