
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowRight, Clock, AlertTriangle, CheckCircle, AlertCircle, Check, X, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { deleteTradeIn } from '../../services/tradeInService';

// Define the shape of a customer from the database
interface Customer {
  first_name: string;
  last_name: string;
}

interface TradeIn {
  id: string;
  customer_id: string;
  trade_in_date: string;
  total_value: number;
  status: 'pending' | 'completed' | 'cancelled';
  customer_name?: string;
  customers?: Customer;  // Changed from array to single object
  notes?: string | null;
  payment_type?: string;
  staff_notes?: string | null;
}

const ManagerDashboard = () => {
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchTradeIns();
  }, []);

  const fetchTradeIns = async () => {
    setIsDataLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from('trade_ins')
        .select(`
          id, 
          customer_id, 
          trade_in_date, 
          total_value, 
          status,
          notes,
          payment_type,
          staff_notes,
          customers (first_name, last_name)
        `)
        .order('trade_in_date', { ascending: false });

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
            status: item.status as 'pending' | 'completed' | 'cancelled',
            notes: item.notes,
            payment_type: item.payment_type,
            staff_notes: item.staff_notes,
            // The customers field is actually an array with a single element
            // but our interface expects a single object, so we take the first item
            customers: item.customers && Array.isArray(item.customers) && item.customers.length > 0
              ? item.customers[0] as Customer
              : undefined,
          };
          
          // Set the customer_name based on the customers object
          tradeIn.customer_name = tradeIn.customers
            ? `${tradeIn.customers.first_name} ${tradeIn.customers.last_name}` 
            : 'Unknown';
            
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Manager Dashboard</h1>

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      {isDataLoading ? (
        <div className="text-center py-8">Loading trade-ins...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Trade-In ID
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tradeIns.map((tradeIn) => (
                <tr key={tradeIn.id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{tradeIn.id.substring(0, 8)}...</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{tradeIn.customer_name}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">
                      {new Date(tradeIn.trade_in_date).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">${formatCurrency(tradeIn.total_value)}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap capitalize">{tradeIn.payment_type || 'Cash'}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <span className="relative inline-block px-3 py-1 font-semibold text-gray-900 leading-tight">
                      <span aria-hidden className="absolute inset-0 bg-gray-200 opacity-50 rounded-full"></span>
                      <span className="relative flex items-center space-x-2">
                        {getStatusIcon(tradeIn.status)}
                        <span>{tradeIn.status}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-600 whitespace-no-wrap max-w-xs truncate">
                      {tradeIn.notes || 'No customer notes'}
                      {tradeIn.staff_notes && (
                        <span className="block italic text-xs mt-1">
                          Staff: {tradeIn.staff_notes}
                        </span>
                      )}
                    </p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <div className="flex items-center space-x-2">
                      <Link to={`/trade-in/${tradeIn.id}`} className="text-blue-500 hover:text-blue-700">
                        <ArrowRight className="inline-block h-4 w-4" />
                      </Link>
                      
                      {tradeIn.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApproveTradeIn(tradeIn.id)}
                            disabled={actionLoading === tradeIn.id}
                            className="p-1 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                            title="Approve Trade-In"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDenyTradeIn(tradeIn.id)}
                            disabled={actionLoading === tradeIn.id}
                            className="p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                            title="Deny Trade-In"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      <button 
                        onClick={() => handleDeleteTradeIn(tradeIn.id)}
                        disabled={actionLoading === tradeIn.id}
                        className="p-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
                        title="Delete Trade-In"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {tradeIns.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No trade-ins found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
