import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

/**
 * Subscribes to postgres_changes on a given table and calls `onRefresh`
 * whenever any INSERT, UPDATE, or DELETE event fires.
 * Cleans up the channel on unmount.
 *
 * Uses a ref for the callback so the channel is never torn down and
 * re-created when the parent component re-renders.
 *
 * @param debounceMs — if provided, collapses burst events into a single
 *   callback fired `debounceMs` after the last event. Useful for tables
 *   where a single user action triggers many row-level changes.
 */
export function useRealtimeRefresh(
  table: string,
  onRefresh: () => void,
  filter?: string,
  debounceMs?: number
) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    // Unique channel name per instance prevents collision when multiple
    // pages/components subscribe to the same table simultaneously
    const channelId = `realtime:${table}:${filter ?? 'all'}:${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        ...(filter ? { filter } : {}),
      }, () => {
        if (debounceMs && debounceMs > 0) {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => onRefreshRef.current(), debounceMs);
        } else {
          onRefreshRef.current();
        }
      })
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [table, filter, debounceMs]); // eslint-disable-line react-hooks/exhaustive-deps
}
