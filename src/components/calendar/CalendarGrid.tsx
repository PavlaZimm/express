'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
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

interface CalendarGridProps {
  initialVehicles: Vehicle[];
  initialHistory: FleetHistory[];
}

export function CalendarGrid({ initialVehicles, initialHistory }: CalendarGridProps) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [history, setHistory] = useState<FleetHistory[]>(initialHistory);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  const weekDates = getWeekDates(weekStart);

  const fetchWeekHistory = useCallback(async (start: Date) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const from = start.toISOString().split('T')[0];
    const toDate = new Date(start);
    toDate.setDate(toDate.getDate() + 6);
    const to = toDate.toISOString().split('T')[0];

    const { data } = await supabase
      .from('fleet_history')
      .select('*')
      .or(`start_time.lte.${to}T23:59:59Z,end_time.is.null`)
      .gte('start_time', from + 'T00:00:00Z');

    if (data) setHistory(data as FleetHistory[]);
  }, []);

  useEffect(() => {
    fetchWeekHistory(weekStart);

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel('calendar-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_history' }, () => {
        fetchWeekHistory(weekStart);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [weekStart, fetchWeekHistory]);

  const rows = buildCalendarRows(initialVehicles, history, weekDates);

  const goToPrevWeek = () => {
    setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  };
  const goToNextWeek = () => {
    setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  };
  const goToToday = () => setWeekStart(getWeekStart(new Date()));

  const todayStr = new Date().toISOString().split('T')[0];

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
        </div>
      </div>

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
    </div>
  );
}
