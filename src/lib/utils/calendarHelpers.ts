import { FleetHistory, VehicleStatus } from '@/types/fleet';

export interface DayStatus {
  date: string; // YYYY-MM-DD
  status: VehicleStatus | null; // dominant status for the day, null = no data
  segments: { status: VehicleStatus; hours: number }[];
}

export interface CalendarRow {
  vehicleId: string;
  spz: string;
  driverName: string | null;
  days: DayStatus[];
}

// Get 7 dates starting from the given Monday (YYYY-MM-DD) in local time
export function getWeekDates(startDate: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
}

// Get the Monday of the week containing the given date
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const MONTHS_CZ = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'];

export function formatWeekLabel(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date, year = false) =>
    `${d.getDate()}. ${MONTHS_CZ[d.getMonth()]}.${year ? ` ${d.getFullYear()}` : ''}`;
  return `${fmt(start)} – ${fmt(end, true)}`;
}

export const DAY_LABELS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

const STATUS_PRIORITY: Record<VehicleStatus, number> = {
  service: 4,
  driving: 3,
  vacation: 2,
  idle: 1,
};

/**
 * For each vehicle × day pair, compute the dominant status
 * based on fleet_history records.
 */
export function buildCalendarRows(
  vehicles: { id: string; spz: string; driver_name: string | null; status: VehicleStatus }[],
  history: FleetHistory[],
  weekDates: string[]
): CalendarRow[] {
  return vehicles.map((vehicle) => {
    const vehicleHistory = history.filter((h) => h.vehicle_id === vehicle.id);

    const days: DayStatus[] = weekDates.map((date) => {
      const dayStart = new Date(date + 'T00:00:00').getTime();
      const dayEnd = new Date(date + 'T23:59:59.999').getTime();

      // Find overlapping history segments for this day
      const overlapping = vehicleHistory.filter((h) => {
        const hStart = new Date(h.start_time).getTime();
        const hEnd = h.end_time ? new Date(h.end_time).getTime() : Date.now();
        return hStart <= dayEnd && hEnd >= dayStart;
      });

      if (overlapping.length === 0) {
        return { date, status: null, segments: [] };
      }

      // Calculate hours per status
      const hoursMap: Partial<Record<VehicleStatus, number>> = {};
      for (const h of overlapping) {
        const hStart = Math.max(new Date(h.start_time).getTime(), dayStart);
        const hEnd = Math.min(
          h.end_time ? new Date(h.end_time).getTime() : Date.now(),
          dayEnd
        );
        const hours = (hEnd - hStart) / 3_600_000;
        hoursMap[h.status] = (hoursMap[h.status] ?? 0) + hours;
      }

      // Dominant status = latest-starting record for this day
      const latest = overlapping.reduce((a, b) =>
        new Date(b.start_time).getTime() > new Date(a.start_time).getTime() ? b : a
      );
      const dominant = latest.status;

      const segments = (Object.entries(hoursMap) as [VehicleStatus, number][])
        .map(([status, hours]) => ({ status, hours }))
        .sort((a, b) => STATUS_PRIORITY[b.status] - STATUS_PRIORITY[a.status]);

      return { date, status: dominant, segments };
    });

    return {
      vehicleId: vehicle.id,
      spz: vehicle.spz,
      driverName: vehicle.driver_name,
      days,
    };
  });
}
