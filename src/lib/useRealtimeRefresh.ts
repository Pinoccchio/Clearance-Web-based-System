import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

/**
 * Subscribes to postgres_changes on a given table and calls `onRefresh`
 * whenever any INSERT, UPDATE, or DELETE event fires.
 * Cleans up the channel on unmount.
 *
 * Uses a ref for the callback so the channel is never torn down and
 * re-created when the parent component re-renders.
 */
export function useRealtimeRefresh(
  table: string,
  onRefresh: () => void,
  filter?: string
) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
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
      }, () => onRefreshRef.current())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [table, filter]); // eslint-disable-line react-hooks/exhaustive-deps
}
