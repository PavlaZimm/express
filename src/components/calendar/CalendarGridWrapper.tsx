'use client';

import nextDynamic from 'next/dynamic';
import { Vehicle, FleetHistory } from '@/types/fleet';

const CalendarGrid = nextDynamic(
  () => import('./CalendarGrid').then((m) => ({ default: m.CalendarGrid })),
  { ssr: false }
);

interface Props {
  initialVehicles: Vehicle[];
  initialHistory: FleetHistory[];
}

export function CalendarGridWrapper(props: Props) {
  return <CalendarGrid {...props} />;
}
