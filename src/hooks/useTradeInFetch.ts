
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TradeIn, StatusFilter } from '../types/tradeIn';

export const useTradeInFetch = (statusFilter: StatusFilter) => {
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          customers (first_name, last_name, id),
          handled_by,
          handled_at,
          created_at
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
            status: item.status,
            notes: item.notes,
            payment_type: item.payment_type as 'cash' | 'trade' | 'mixed',
            staff_notes: item.staff_notes,
            handled_by: item.handled_by,
            handled_at: item.handled_at,
            created_at: item.created_at
          };
          
          // Handle the customers object which may be returned as an object or an array with a single object
          if (item.customers) {
            // First, check the type of item.customers and handle accordingly
            if (Array.isArray(item.customers)) {
              // If it's an array, take the first customer if available
              if (item.customers.length > 0) {
                const customer = item.customers[0] as any;
                tradeIn.customers = {
                  id: customer.id || '',
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
                id: customerData.id || '',
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
        
        // Now fetch emails for each handled_by user ID
        if (tradeInsWithCustomerName.length > 0) {
          // Get all handled_by IDs that are not null
          const handledByIds = tradeInsWithCustomerName
            .filter(item => item.handled_by)
            .map(item => item.handled_by as string);
            
          if (handledByIds.length > 0) {
            // Fetch emails for these users
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, email')
              .in('id', handledByIds);
              
            if (!profilesError && profilesData) {
              // Create a map of user IDs to emails
              const emailMap = new Map();
              profilesData.forEach(profile => {
                emailMap.set(profile.id, profile.email);
              });
              
              // Update the trade-ins with submitter emails
              tradeInsWithCustomerName.forEach(tradeIn => {
                if (tradeIn.handled_by) {
                  tradeIn.submitter_email = emailMap.get(tradeIn.handled_by) || null;
                }
              });
            }
          }
        }
        
        setTradeIns(tradeInsWithCustomerName);
      }
    } catch (err) {
      console.error('Error fetching trade-ins:', err);
      setErrorMessage('Failed to fetch trade-ins');
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchTradeIns();
  }, [statusFilter]);

  return {
    tradeIns,
    setTradeIns,
    isDataLoading,
    errorMessage,
    fetchTradeIns
  };
};
