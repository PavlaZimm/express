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
    const supabase = getSupabaseClient();
    if (!supabase) return; // env vars not configured

    setLoading(true);

    let query = supabase
      .from('fleet_history')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(500);

    if (f.statusFilter !== 'all') {
      query = query.eq('status', f.statusFilter);
    }
    if (f.spzSearch.trim()) {
      // Sanitize: max 20 chars, only alphanumeric + spaces
      const sanitized = f.spzSearch.trim().slice(0, 20).replace(/[^A-Za-z0-9\s]/g, '');
      if (sanitized) query = query.ilike('spz', `%${sanitized}%`);
    }
    if (f.dateFrom) {
      query = query.gte('start_time', f.dateFrom + 'T00:00:00.000Z');
    }
    if (f.dateTo) {
      query = query.lte('start_time', f.dateTo + 'T23:59:59.999Z');
    }
    // Limit date range to max 366 days to prevent expensive full-table scans
    if (f.dateFrom && f.dateTo) {
      const diffDays = (new Date(f.dateTo).getTime() - new Date(f.dateFrom).getTime()) / 86_400_000;
      if (diffDays > 366) return;
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
    if (!supabase) return; // env vars not configured

    const channel = supabase
      .channel('history-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fleet_history' },
        () => {
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
