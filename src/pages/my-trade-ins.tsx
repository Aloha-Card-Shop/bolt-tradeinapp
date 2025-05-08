
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSession } from '../hooks/useSession';
import { TradeIn } from '../types/tradeIn';
import TradeInTable from '../components/dashboard/TradeInTable';

const MyTradeIns: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useSession();
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
      // First, get the customer profile associated with the user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        setErrorMessage('Error fetching your profile data');
        setIsLoading(false);
        return;
      }
      
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
          status: item.status as 'pending' | 'completed' | 'cancelled',
          notes: item.notes,
          payment_type: item.payment_type as 'cash' | 'trade' | 'mixed',
          staff_notes: item.staff_notes,
          customer_name: item.customers 
            ? `${item.customers.first_name || ''} ${item.customers.last_name || ''}` 
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
                  items: data.map(item => ({
                    id: item.id,
                    trade_in_id: item.trade_in_id,
                    card_id: item.card_id,
                    quantity: item.quantity,
                    price: item.price,
                    condition: item.condition,
                    attributes: item.attributes,
                    card_name: item.cards?.name || 'Unknown Card',
                    set_name: item.cards?.set_name || 'Unknown Set',
                    image_url: item.cards?.image_url,
                    rarity: item.cards?.rarity
                  }))
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
    if (!loading && !user) {
      navigate('/login');
    } else if (user) {
      fetchUserTradeIns();
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Trade-ins</h1>
          <p className="text-gray-600 mt-1">View status and details of your trade-in requests</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="ml-3 text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <TradeInTable 
            tradeIns={tradeIns}
            isLoading={isLoading}
            expandedTradeIn={expandedTradeIn}
            loadingItems={loadingItems}
            actionLoading={null}
            onToggleDetails={handleToggleDetails}
            onApprove={() => {}}
            onDeny={() => {}}
            onDelete={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default MyTradeIns;
