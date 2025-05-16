
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { TradeIn } from '../types/tradeIn';
import { deleteTradeIn } from '../services/tradeInService';

export const useTradeInActions = (setTradeIns: React.Dispatch<React.SetStateAction<TradeIn[]>>) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApproveTradeIn = async (tradeInId: string) => {
    setActionLoading(tradeInId);
    try {
      const { error } = await supabase
        .from('trade_ins')
        .update({ 
          status: 'accepted',
          handled_at: new Date().toISOString(),
          handled_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', tradeInId);

      if (error) throw error;

      // Update local state
      setTradeIns(prev => prev.map(tradeIn => {
        if (tradeIn.id === tradeInId) {
          return { ...tradeIn, status: 'accepted' as const };
        }
        return tradeIn;
      }));
    } catch (err) {
      console.error('Error approving trade-in:', err);
      setErrorMessage(`Failed to approve trade-in: ${(err as Error).message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDenyTradeIn = async (tradeInId: string) => {
    setActionLoading(tradeInId);
    try {
      const { error } = await supabase
        .from('trade_ins')
        .update({ 
          status: 'rejected',
          handled_at: new Date().toISOString(),
          handled_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', tradeInId);

      if (error) throw error;

      // Update local state
      setTradeIns(prev => prev.map(tradeIn => {
        if (tradeIn.id === tradeInId) {
          return { ...tradeIn, status: 'rejected' as const };
        }
        return tradeIn;
      }));
    } catch (err) {
      console.error('Error denying trade-in:', err);
      setErrorMessage(`Failed to deny trade-in: ${(err as Error).message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTradeIn = async (tradeInId: string) => {
    if (!confirm('Are you sure you want to delete this trade-in? This action cannot be undone.')) {
      return;
    }

    setActionLoading(tradeInId);
    try {
      await deleteTradeIn(tradeInId);
      
      // Update local state
      setTradeIns(prev => prev.filter(tradeIn => tradeIn.id !== tradeInId));
    } catch (err) {
      console.error('Error deleting trade-in:', err);
      setErrorMessage(`Failed to delete trade-in: ${(err as Error).message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return {
    actionLoading,
    actionsErrorMessage: errorMessage,
    handleApproveTradeIn,
    handleDenyTradeIn,
    handleDeleteTradeIn
  };
};
