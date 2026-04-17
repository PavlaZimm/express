'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, X } from 'lucide-react';
import { Vehicle, FleetHistory, VehicleStatus } from '@/types/fleet';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  getWeekStart,
  getWeekDates,
  formatWeekLabel,
  DAY_LABELS,
  buildCalendarRows,
  DayStatus,
} from '@/lib/utils/calendarHelpers';
import { STATUS_LABELS, STATUS_DOT } from '@/lib/utils/statusHelpers';

const CELL_BG: Record<VehicleStatus, string> = {
  driving:  'bg-green-500',
  vacation: 'bg-orange-400',
  service:  'bg-red-500',
  idle:     'bg-gray-200',
};

const CELL_TEXT: Record<VehicleStatus, string> = {
  driving:  'text-white',
  vacation: 'text-white',
  service:  'text-white',
  idle:     'text-gray-500',
};

interface TooltipInfo {
  day: DayStatus;
  spz: string;
  x: number;
  y: number;
}

interface ManualEntryForm {
  vehicleId: string;
  status: VehicleStatus;
  startTime: string; // datetime-local value
  endTime: string;   // datetime-local value, optional
}

interface CalendarGridProps {
  initialVehicles: Vehicle[];
  initialHistory: FleetHistory[];
}

export function CalendarGrid({ initialVehicles, initialHistory }: CalendarGridProps) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [history, setHistory] = useState<FleetHistory[]>(initialHistory);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const todayLocal = new Date();
  const todayStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;

  const [form, setForm] = useState<ManualEntryForm>({
    vehicleId: initialVehicles[0]?.id ?? '',
    status: 'driving',
    startTime: `${todayStr}T00:00`,
    endTime: '',
  });

  const weekDates = getWeekDates(weekStart);

  const fetchWeekHistory = useCallback(async (start: Date) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const from = fmt(start);
    const toDate = new Date(start);
    toDate.setDate(toDate.getDate() + 6);
    const to = fmt(toDate);

    const [{ data: weekData, error: e1 }, { data: activeData, error: e2 }] = await Promise.all([
      supabase
        .from('fleet_history')
        .select('*')
        .gte('start_time', `${from}T00:00:00Z`)
        .lte('start_time', `${to}T23:59:59.999Z`),
      supabase
        .from('fleet_history')
        .select('*')
        .is('end_time', null),
    ]);

    if (e1 || e2) { console.error('[CalendarGrid] fetch error:', e1 ?? e2); return; }

    const merged = new Map<string, FleetHistory>();
    for (const r of [...(weekData ?? []), ...(activeData ?? [])]) merged.set(r.id, r as FleetHistory);
    setHistory(Array.from(merged.values()));
  }, []);

  useEffect(() => {
    fetchWeekHistory(weekStart);

    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchWeekHistory(weekStart);
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(() => fetchWeekHistory(weekStart), 30_000);

    const supabase = getSupabaseClient();
    if (!supabase) {
      return () => {
        document.removeEventListener('visibilitychange', onVisible);
        clearInterval(timer);
      };
    }

    const channel = supabase
      .channel('calendar-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_history' }, () => {
        fetchWeekHistory(weekStart);
      })
      .subscribe();

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [weekStart, fetchWeekHistory]);

  const handleSave = async () => {
    setFormError(null);

    if (!form.vehicleId) { setFormError('Vyberte vozidlo.'); return; }
    if (!form.startTime) { setFormError('Zadejte datum a čas Od.'); return; }

    const startISO = new Date(form.startTime).toISOString();
    const endISO = form.endTime ? new Date(form.endTime).toISOString() : null;

    if (endISO && endISO <= startISO) {
      setFormError('Datum Do musí být po datu Od.');
      return;
    }

    const vehicle = initialVehicles.find((v) => v.id === form.vehicleId);
    if (!vehicle) { setFormError('Vozidlo nenalezeno.'); return; }

    const supabase = getSupabaseClient();
    if (!supabase) { setFormError('Supabase není nakonfigurováno.'); return; }

    setSaving(true);
    const { error } = await supabase.from('fleet_history').insert({
      vehicle_id: vehicle.id,
      spz: vehicle.spz,
      status: form.status,
      start_time: startISO,
      end_time: endISO,
    });
    setSaving(false);

    if (error) {
      setFormError(`Chyba: ${error.message} (code: ${error.code})`);
      return;
    }

    // Navigate calendar to the week containing the new record
    const insertedDate = new Date(form.startTime);
    const targetWeek = getWeekStart(insertedDate);
    setWeekStart(targetWeek);
    setShowForm(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    fetchWeekHistory(targetWeek);
  };

  const openForm = () => {
    setForm({
      vehicleId: initialVehicles[0]?.id ?? '',
      status: 'driving',
      startTime: `${todayStr}T00:00`,
      endTime: '',
    });
    setFormError(null);
    setShowForm(true);
  };

  const rows = buildCalendarRows(initialVehicles, history, weekDates);

  const goToPrevWeek = () => {
    setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  };
  const goToNextWeek = () => {
    setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  };
  const goToToday = () => setWeekStart(getWeekStart(new Date()));

  return (
    <div className="flex flex-col gap-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Přehled týdne</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevWeek}
            className="p-1.5 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Dnes
          </button>
          <button
            onClick={goToNextWeek}
            className="p-1.5 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm text-gray-500 ml-1">{formatWeekLabel(weekStart)}</span>
          <button
            onClick={openForm}
            className="ml-2 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Přidat záznam
          </button>
        </div>
      </div>

      {/* Success toast */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          Záznam byl uložen ✓
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(['driving', 'vacation', 'service', 'idle'] as VehicleStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm ${CELL_BG[s]}`} />
            <span className="text-xs text-gray-600">{STATUS_LABELS[s]}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40 min-w-[10rem]">
                Vozidlo
              </th>
              {weekDates.map((date, i) => {
                const isToday = date === todayStr;
                return (
                  <th
                    key={date}
                    className={`px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[5rem] ${
                      isToday ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    <div>{DAY_LABELS[i]}</div>
                    <div className={`text-base font-bold mt-0.5 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                      {new Date(date + 'T12:00:00').getDate()}
                    </div>
                    {isToday && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mx-auto mt-0.5" />}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row) => (
              <tr key={row.vehicleId} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono font-bold text-gray-900 text-sm">{row.spz}</span>
                  {row.driverName && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[9rem]">{row.driverName}</p>
                  )}
                </td>
                {row.days.map((day) => {
                  const isToday = day.date === todayStr;
                  return (
                    <td key={day.date} className={`px-1.5 py-2 text-center ${isToday ? 'bg-blue-50/30' : ''}`}>
                      {day.status ? (
                        <button
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltip({ day, spz: row.spz, x: rect.left + rect.width / 2, y: rect.top });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                          className={`w-full rounded-lg py-2 text-xs font-medium transition-opacity hover:opacity-80 ${CELL_BG[day.status]} ${CELL_TEXT[day.status]}`}
                        >
                          {STATUS_LABELS[day.status]}
                        </button>
                      ) : (
                        <div className="w-full rounded-lg py-2 text-xs text-gray-300">—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 pointer-events-none shadow-xl max-w-[200px]"
          style={{ left: tooltip.x, top: tooltip.y - 8, transform: 'translate(-50%, -100%)' }}
        >
          <p className="font-bold mb-1">{tooltip.spz} · {new Date(tooltip.day.date + 'T12:00:00').toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          {tooltip.day.segments.map((seg) => (
            <div key={seg.status} className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT[seg.status]}`} />
              <span>{STATUS_LABELS[seg.status]}: {seg.hours < 1 ? `${Math.round(seg.hours * 60)}m` : `${seg.hours.toFixed(1)}h`}</span>
            </div>
          ))}
        </div>
      )}

      {/* Manual entry modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900">Přidat záznam ručně</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Vozidlo */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Vozidlo</label>
                <select
                  value={form.vehicleId}
                  onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {initialVehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.spz} ({v.type})</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as VehicleStatus }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(['driving', 'vacation', 'service', 'idle'] as VehicleStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              {/* Od */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Od</label>
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Do */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Do <span className="text-gray-400 font-normal">(volitelné — prázdné = stále aktivní)</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {formError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Zrušit
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Ukládám…' : 'Uložit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
