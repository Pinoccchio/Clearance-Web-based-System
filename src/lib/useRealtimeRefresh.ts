import { useEffect } from 'react';
import { supabase } from './supabase';

/**
 * Subscribes to postgres_changes on a given table and calls `onRefresh`
 * whenever any INSERT, UPDATE, or DELETE event fires.
 * Cleans up the channel on unmount.
 */
export function useRealtimeRefresh(
  table: string,
  onRefresh: () => void,
  filter?: string
) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}:${filter ?? 'all'}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        ...(filter ? { filter } : {}),
      }, () => onRefresh())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [table, filter, onRefresh]);
}
