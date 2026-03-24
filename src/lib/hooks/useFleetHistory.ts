'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { FleetHistory, HistoryFilters } from '@/types/fleet';

const DEFAULT_FILTERS: HistoryFilters = {
  statusFilter: 'all',
  spzSearch: '',
  dateFrom: '',
  dateTo: '',
  activeOnly: false,
};

export function useFleetHistory(initialHistory: FleetHistory[]) {
  const [history, setHistory] = useState<FleetHistory[]>(initialHistory);
  const [filters, setFilters] = useState<HistoryFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async (f: HistoryFilters) => {
    setLoading(true);
    const supabase = getSupabaseClient();

    let query = supabase
      .from('fleet_history')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(500);

    if (f.statusFilter !== 'all') {
      query = query.eq('status', f.statusFilter);
    }
    if (f.spzSearch.trim()) {
      query = query.ilike('spz', `%${f.spzSearch.trim()}%`);
    }
    if (f.dateFrom) {
      query = query.gte('start_time', f.dateFrom + 'T00:00:00.000Z');
    }
    if (f.dateTo) {
      query = query.lte('start_time', f.dateTo + 'T23:59:59.999Z');
    }
    if (f.activeOnly) {
      query = query.is('end_time', null);
    }

    const { data, error } = await query;
    if (!error && data) {
      setHistory(data as FleetHistory[]);
    }
    setLoading(false);
  }, []);

  // Re-fetch whenever filters change
  useEffect(() => {
    fetchHistory(filters);
  }, [filters, fetchHistory]);

  // Realtime: refresh when fleet_history changes
  useEffect(() => {
    const supabase = getSupabaseClient();

    const channel = supabase
      .channel('history-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fleet_history' },
        () => {
          // Re-fetch with current filters on any change
          fetchHistory(filters);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters, fetchHistory]);

  return { history, filters, setFilters, loading };
}
