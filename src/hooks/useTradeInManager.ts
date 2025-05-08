
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { deleteTradeIn } from '../services/tradeInService';

interface Customer {
  first_name: string;
  last_name: string;
}

export interface TradeInItem {
  card_name: string;
  quantity: number;
  price: number;
  condition: string;
  attributes: {
    isFirstEdition?: boolean;
    isHolo?: boolean;
    paymentType?: 'cash' | 'trade';
    cashValue?: number;
    tradeValue?: number;
  };
}

export interface TradeIn {
  id: string;
  customer_id: string;
  trade_in_date: string;
  total_value: number;
  cash_value: number;
  trade_value: number;
  status: 'pending' | 'completed' | 'cancelled';
  customer_name?: string;
  customers?: Customer;
  notes?: string | null;
  payment_type?: 'cash' | 'trade' | 'mixed';
  staff_notes?: string | null;
  items?: TradeInItem[];
}

export const useTradeInManager = () => {
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedTradeIn, setExpandedTradeIn] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    fetchTradeIns();
  }, [statusFilter]);

  const fetchTradeIns = async () => {
    setIsDataLoading(true);
    setErrorMessage(null);

    try {
      let query = supabase
        .from('trade_ins')
        .select(`
          id, 
          customer_id, 
          trade_in_date, 
          total_value, 
          cash_value,
          trade_value,
          status,
          notes,
          payment_type,
          staff_notes,
          customers (first_name, last_name)
        `);

      // Apply status filter if not showing all
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('trade_in_date', { ascending: false });

      if (error) {
        console.error('Error fetching trade-ins:', error);
        setErrorMessage(`Error fetching trade-ins: ${error.message}`);
      } else if (data) {
        // Transform data to match our interface
        const tradeInsWithCustomerName = data.map(item => {
          // Create a properly typed object
          const tradeIn: TradeIn = {
            id: item.id,
            customer_id: item.customer_id,
            trade_in_date: item.trade_in_date,
            total_value: item.total_value,
            cash_value: item.cash_value || 0,
            trade_value: item.trade_value || 0,
            status: item.status as 'pending' | 'completed' | 'cancelled',
            notes: item.notes,
            payment_type: item.payment_type as 'cash' | 'trade' | 'mixed',
            staff_notes: item.staff_notes,
          };
          
          // Handle the customers object which may be returned as an object or an array with a single object
          if (item.customers) {
            // First, check the type of item.customers and handle accordingly
            if (Array.isArray(item.customers)) {
              // If it's an array, take the first customer if available
              if (item.customers.length > 0) {
                const customer = item.customers[0] as any;
                tradeIn.customers = {
                  first_name: customer.first_name || '',
                  last_name: customer.last_name || ''
                };
                tradeIn.customer_name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown';
              } else {
                tradeIn.customer_name = 'Unknown';
              }
            } else {
              // If it's an object, use it directly with type assertion
              const customerData = item.customers as any;
              tradeIn.customers = {
                first_name: customerData.first_name || '',
                last_name: customerData.last_name || ''
              };
              tradeIn.customer_name = `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim() || 'Unknown';
            }
          } else {
            tradeIn.customer_name = 'Unknown';
          }
            
          return tradeIn;
        });
        
        setTradeIns(tradeInsWithCustomerName);
      }
    } catch (err) {
      console.error('Error fetching trade-ins:', err);
      setErrorMessage('Failed to fetch trade-ins');
    } finally {
      setIsDataLoading(false);
    }
  };

  const fetchTradeInItems = async (tradeInId: string) => {
    setLoadingItems(tradeInId);
    try {
      const { data, error } = await supabase
        .from('trade_in_items')
        .select(`
          quantity,
          price,
          condition,
          attributes,
          cards:card_id(name)
        `)
        .eq('trade_in_id', tradeInId);

      if (error) throw error;

      // Fix the type issue with cards.name and handle attributes correctly
      const items = data.map(item => {
        const cardName = item.cards ? (typeof item.cards === 'object' && item.cards !== null ? (item.cards as any).name : 'Unknown Card') : 'Unknown Card';
        
        return {
          card_name: cardName,
          quantity: item.quantity,
          price: item.price,
          condition: item.condition,
          attributes: {
            ...item.attributes,
            // Ensure these values are properly typed
            paymentType: item.attributes?.paymentType || 'cash',
            isFirstEdition: !!item.attributes?.isFirstEdition,
            isHolo: !!item.attributes?.isHolo,
            cashValue: item.attributes?.cashValue ? Number(item.attributes.cashValue) : undefined,
            tradeValue: item.attributes?.tradeValue ? Number(item.attributes.tradeValue) : undefined
          }
        };
      });

      // Update the trade-ins state with the fetched items
      setTradeIns(prev => prev.map(tradeIn => 
        tradeIn.id === tradeInId ? { ...tradeIn, items } : tradeIn
      ));
    } catch (err) {
      console.error('Error fetching trade-in items:', err);
      setErrorMessage(`Failed to fetch items for trade-in: ${(err as Error).message}`);
    } finally {
      setLoadingItems(null);
    }
  };

  const toggleTradeInDetails = async (tradeInId: string) => {
    if (expandedTradeIn === tradeInId) {
      // Collapse if already expanded
      setExpandedTradeIn(null);
    } else {
      // Expand and fetch items if needed
      setExpandedTradeIn(tradeInId);
      const tradeIn = tradeIns.find(t => t.id === tradeInId);
      if (!tradeIn?.items) {
        await fetchTradeInItems(tradeInId);
      }
    }
  };

  const handleApproveTradeIn = async (tradeInId: string) => {
    setActionLoading(tradeInId);
    try {
      const { error } = await supabase
        .from('trade_ins')
        .update({ 
          status: 'completed',
          handled_at: new Date().toISOString(),
          handled_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', tradeInId);

      if (error) throw error;

      // Update local state
      setTradeIns(prev => prev.map(tradeIn => 
        tradeIn.id === tradeInId ? {...tradeIn, status: 'completed'} : tradeIn
      ));
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
          status: 'cancelled',
          handled_at: new Date().toISOString(),
          handled_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', tradeInId);

      if (error) throw error;

      // Update local state
      setTradeIns(prev => prev.map(tradeIn => 
        tradeIn.id === tradeInId ? {...tradeIn, status: 'cancelled'} : tradeIn
      ));
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
    tradeIns,
    isDataLoading,
    errorMessage,
    actionLoading,
    expandedTradeIn,
    loadingItems,
    statusFilter,
    setStatusFilter,
    toggleTradeInDetails,
    handleApproveTradeIn,
    handleDenyTradeIn,
    handleDeleteTradeIn
  };
};
