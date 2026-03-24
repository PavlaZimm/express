import { Truck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase/server';
import { VehicleGrid } from '@/components/dashboard/VehicleGrid';
import { HistoryTable } from '@/components/history/HistoryTable';
import { Vehicle, FleetHistory } from '@/types/fleet';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
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

  let safeVehicles: Vehicle[] = demoVehicles;
  let safeHistory: FleetHistory[] = [];

  if (isConfigured) {
    const supabase = getSupabaseServer();
    const [{ data: vehicles }, { data: history }] = await Promise.all([
      supabase.from('vehicles').select('*').order('spz'),
      supabase
        .from('fleet_history')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(500),
    ]);
    safeVehicles = (vehicles as Vehicle[]) ?? [];
    safeHistory = (history as FleetHistory[]) ?? [];
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <Truck className="w-4 h-4" />
            </div>
            <span className="font-semibold text-gray-900 text-base">Fleet Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg"
              >
                Dashboard
              </Link>
              <Link
                href="/calendar"
                className="px-3 py-1.5 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Kalendář
              </Link>
            </nav>
            {/* Status indicator */}
            {isConfigured ? (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500">Realtime</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-amber-400 rounded-full" />
                <span className="text-xs text-amber-600">Není nakonfigurováno</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Setup banner when env vars are missing */}
      {!isConfigured && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">Chybí Supabase konfigurace</p>
              <p className="mt-0.5">
                Přejdi do{' '}
                <strong>Vercel Dashboard → express → Settings → Environment Variables</strong>
                {' '}a nastav:
              </p>
              <code className="mt-1 block bg-amber-100 rounded px-2 py-1 text-xs font-mono">
                NEXT_PUBLIC_SUPABASE_URL = https://xxxx.supabase.co<br />
                NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
              </code>
              <p className="mt-1">Poté spusť <strong>Redeploy</strong>.</p>
            </div>
          </div>
        </div>
      )}

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
