
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSession } from './useSession';
import { TradeIn } from '../types/tradeIn';

export const useMyTradeIns = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useSession();
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedTradeIn, setExpandedTradeIn] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState<string | null>(null);

  // Function to fetch the user's own trade-ins
  const fetchUserTradeIns = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Now fetch all trade-ins associated with this user
      const { data, error } = await supabase
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
        `)
        .eq('customer_id', user.id) // Show only trade-ins created by the current user
        .order('trade_in_date', { ascending: false });

      if (error) {
        console.error('Error fetching trade-ins:', error);
        setErrorMessage(`Error fetching your trade-ins: ${error.message}`);
      } else if (data) {
        // Transform data to match our interface
        const transformedData: TradeIn[] = data.map(item => ({
          id: item.id,
          customer_id: item.customer_id,
          trade_in_date: item.trade_in_date,
          total_value: item.total_value,
          cash_value: item.cash_value || 0,
          trade_value: item.trade_value || 0,
          status: item.status as 'pending' | 'accepted' | 'rejected',
          notes: item.notes,
          payment_type: item.payment_type as 'cash' | 'trade' | 'mixed',
          staff_notes: item.staff_notes,
          customer_name: item.customers 
            ? (typeof item.customers === 'object' 
              ? Array.isArray(item.customers)
                ? `${item.customers[0]?.first_name || ''} ${item.customers[0]?.last_name || ''}` 
                : `${(item.customers as any).first_name || ''} ${(item.customers as any).last_name || ''}`
              : 'Unknown')
            : 'Unknown',
          customers: item.customers as any
        }));
        
        setTradeIns(transformedData);
      }
    } catch (err) {
      console.error('Error fetching trade-ins:', err);
      setErrorMessage('Failed to fetch your trade-ins');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch trade-in items when a trade-in is expanded
  const fetchTradeInItems = async (tradeInId: string) => {
    if (loadingItems === tradeInId) return;
    
    setLoadingItems(tradeInId);
    
    try {
      const { data, error } = await supabase
        .from('trade_in_items')
        .select(`
          id, 
          trade_in_id, 
          card_id, 
          quantity, 
          price, 
          condition,
          attributes,
          cards (name, set_name, image_url, rarity)
        `)
        .eq('trade_in_id', tradeInId);
        
      if (error) {
        console.error('Error fetching trade-in items:', error);
        return;
      }
      
      if (data) {
        // Update our trade-ins with the fetched items
        setTradeIns(prevTradeIns => 
          prevTradeIns.map(tradeIn => 
            tradeIn.id === tradeInId 
              ? { 
                  ...tradeIn, 
                  items: data.map(item => {
                    // Handle cards data that might be returned as array or object
                    const cardData = item.cards 
                      ? (Array.isArray(item.cards) ? item.cards[0] : item.cards) 
                      : null;
                    
                    return {
                      id: item.id,
                      trade_in_id: item.trade_in_id,
                      card_id: item.card_id,
                      quantity: item.quantity,
                      price: item.price,
                      condition: item.condition,
                      attributes: item.attributes,
                      card_name: cardData?.name || 'Unknown Card',
                      set_name: cardData?.set_name || 'Unknown Set',
                      image_url: cardData?.image_url,
                      rarity: cardData?.rarity
                    };
                  })
                }
              : tradeIn
          )
        );
      }
    } catch (err) {
      console.error('Error fetching trade-in items:', err);
    } finally {
      setLoadingItems(null);
    }
  };

  // Toggle expanded details
  const handleToggleDetails = (id: string) => {
    if (expandedTradeIn === id) {
      setExpandedTradeIn(null);
    } else {
      setExpandedTradeIn(id);
      fetchTradeInItems(id);
    }
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      navigate('/login');
    } else if (user) {
      fetchUserTradeIns();
    }
  }, [user, userLoading, navigate]);

  return {
    tradeIns,
    isLoading,
    errorMessage,
    expandedTradeIn,
    loadingItems,
    handleToggleDetails
  };
};
