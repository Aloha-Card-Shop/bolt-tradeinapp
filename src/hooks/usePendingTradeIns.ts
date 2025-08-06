import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

export const usePendingTradeIns = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPendingCount = async () => {
    try {
      const { count, error } = await supabase
        .from('trade_ins')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching pending count:', error);
      } else {
        setPendingCount(count || 0);
      }
    } catch (err) {
      console.error('Error fetching pending count:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCount();

    // Set up real-time subscription for pending trade-ins
    const channel = supabase
      .channel('pending-trade-ins')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trade_ins',
          filter: 'status=eq.pending'
        },
        (payload) => {
          console.log('Pending trade-ins changed:', payload);
          fetchPendingCount();
        }
      )
      .subscribe();

    // Also listen for status changes that might affect pending count
    const statusChannel = supabase
      .channel('trade-in-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trade_ins'
        },
        (payload) => {
          console.log('Trade-in status changed:', payload);
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(statusChannel);
    };
  }, []);

  return {
    pendingCount,
    isLoading,
    refreshPendingCount: fetchPendingCount
  };
};