export type VehicleStatus = 'driving' | 'vacation' | 'service' | 'idle';

export interface Vehicle {
  id: string;
  spz: string;
  status: VehicleStatus;
}

export interface FleetHistory {
  id: string;
  vehicle_id: string;
  spz: string;
  status: VehicleStatus;
  start_time: string; // ISO 8601
  end_time: string | null;
}

export interface HistoryFilters {
  statusFilter: VehicleStatus | 'all';
  spzSearch: string;
  dateFrom: string; // YYYY-MM-DD or ''
  dateTo: string;   // YYYY-MM-DD or ''
  activeOnly: boolean;
}
