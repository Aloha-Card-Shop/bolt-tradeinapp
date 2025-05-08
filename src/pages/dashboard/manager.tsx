
import { useState, useEffect } from 'react';
import React from 'react';
import { supabase } from '../../lib/supabase';
import { Clock, AlertTriangle, CheckCircle, AlertCircle, Check, X, Trash2, DollarSign, Tag, ChevronDown, ChevronUp, Loader2, Filter } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { deleteTradeIn } from '../../services/tradeInService';

// Define the shape of a customer from the database
interface Customer {
  first_name: string;
  last_name: string;
}

interface TradeInItem {
  card_name: string;
  quantity: number;
  price: number;
  condition: string;
  attributes: {
    isFirstEdition?: boolean;
    isHolo?: boolean;
    paymentType?: 'cash' | 'trade';
  };
}

interface TradeIn {
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

const ManagerDashboard = () => {
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
            if (Array.isArray(item.customers)) {
              // If it's an array, take the first customer
              if (item.customers.length > 0) {
                const customer = item.customers[0];
                tradeIn.customers = {
                  first_name: customer.first_name,
                  last_name: customer.last_name
                };
                tradeIn.customer_name = `${customer.first_name} ${customer.last_name}`;
              } else {
                tradeIn.customer_name = 'Unknown';
              }
            } else {
              // If it's an object, use it directly
              tradeIn.customers = {
                first_name: item.customers.first_name,
                last_name: item.customers.last_name
              };
              tradeIn.customer_name = `${item.customers.first_name} ${item.customers.last_name}`;
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

      const items = data.map(item => ({
        card_name: item.cards?.name || 'Unknown Card',
        quantity: item.quantity,
        price: item.price,
        condition: item.condition,
        attributes: item.attributes
      }));

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

  const getPaymentTypeIcon = (paymentType: string) => {
    switch (paymentType) {
      case 'cash':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'trade':
        return <Tag className="h-4 w-4 text-blue-500" />;
      case 'mixed':
        return (
          <div className="flex">
            <DollarSign className="h-4 w-4 text-green-500 mr-1" />
            <Tag className="h-4 w-4 text-blue-500" />
          </div>
        );
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConditionDisplay = (condition: string) => {
    const conditionMap: Record<string, string> = {
      'near_mint': 'Near Mint',
      'lightly_played': 'Lightly Played',
      'moderately_played': 'Moderately Played',
      'heavily_played': 'Heavily Played',
      'damaged': 'Damaged'
    };
    return conditionMap[condition] || condition;
  };

  const getFilteredTradeIns = () => {
    if (statusFilter === 'all') {
      return tradeIns;
    }
    return tradeIns.filter(tradeIn => tradeIn.status === statusFilter);
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

      {/* Status Filter */}
      <div className="mb-6 flex items-center">
        <Filter className="h-5 w-5 text-gray-500 mr-2" />
        <span className="mr-3 text-sm font-medium text-gray-700">Filter status:</span>
        <div className="flex space-x-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 text-sm rounded-full ${
              statusFilter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 text-sm rounded-full ${
              statusFilter === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 text-sm rounded-full ${
              statusFilter === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-3 py-1 text-sm rounded-full ${
              statusFilter === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {isDataLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
          <p className="mt-2">Loading trade-ins...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Cash Value
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Trade Value
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {getFilteredTradeIns().map((tradeIn) => (
                <React.Fragment key={tradeIn.id}>
                  <tr 
                    className={`hover:bg-gray-50 cursor-pointer ${expandedTradeIn === tradeIn.id ? 'bg-blue-50' : 'bg-white'}`}
                    onClick={() => toggleTradeInDetails(tradeIn.id)}
                  >
                    <td className="px-5 py-5 border-b border-gray-200 text-sm">
                      <div className="flex items-center">
                        {expandedTradeIn === tradeIn.id ? (
                          <ChevronUp className="h-4 w-4 text-gray-500 mr-2" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500 mr-2" />
                        )}
                        <p className="text-gray-900 whitespace-no-wrap">{tradeIn.customer_name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {new Date(tradeIn.trade_in_date).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">${formatCurrency(tradeIn.cash_value)}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">${formatCurrency(tradeIn.trade_value)}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 text-sm">
                      <span className="relative inline-block px-3 py-1 font-semibold text-gray-900 leading-tight">
                        <span aria-hidden className="absolute inset-0 bg-gray-200 opacity-50 rounded-full"></span>
                        <span className="relative flex items-center space-x-1">
                          {getPaymentTypeIcon(tradeIn.payment_type || 'cash')}
                          <span className="capitalize">{tradeIn.payment_type || 'cash'}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 text-sm">
                      <span className="relative inline-block px-3 py-1 font-semibold text-gray-900 leading-tight">
                        <span aria-hidden className="absolute inset-0 bg-gray-200 opacity-50 rounded-full"></span>
                        <span className="relative flex items-center space-x-1">
                          {getStatusIcon(tradeIn.status)}
                          <span>{tradeIn.status}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 text-sm">
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        {tradeIn.status === 'pending' && (
                          <>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveTradeIn(tradeIn.id);
                              }}
                              disabled={actionLoading === tradeIn.id}
                              className="p-1 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                              title="Approve Trade-In"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDenyTradeIn(tradeIn.id);
                              }}
                              disabled={actionLoading === tradeIn.id}
                              className="p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                              title="Deny Trade-In"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTradeIn(tradeIn.id);
                          }}
                          disabled={actionLoading === tradeIn.id}
                          className="p-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
                          title="Delete Trade-In"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded details row */}
                  {expandedTradeIn === tradeIn.id && (
                    <tr>
                      <td colSpan={7} className="px-5 py-5 border-b border-gray-200 bg-gray-50">
                        <div className="pl-6">
                          {/* Trade-in details */}
                          <div className="mb-4">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Trade-In Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-700"><strong>ID:</strong> {tradeIn.id}</p>
                                <p className="text-sm text-gray-700">
                                  <strong>Date:</strong> {new Date(tradeIn.trade_in_date).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-700">
                                  <strong>Total Value:</strong> ${formatCurrency(tradeIn.total_value)}
                                </p>
                                <p className="text-sm text-gray-700">
                                  <strong>Status:</strong> {tradeIn.status}
                                </p>
                              </div>
                            </div>
                            {tradeIn.notes && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-700"><strong>Customer Notes:</strong></p>
                                <p className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                                  {tradeIn.notes}
                                </p>
                              </div>
                            )}
                            {tradeIn.staff_notes && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-700"><strong>Staff Notes:</strong></p>
                                <p className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                                  {tradeIn.staff_notes}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {/* Items */}
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Trade-In Items</h3>
                            {loadingItems === tradeIn.id ? (
                              <div className="text-center py-4">
                                <Loader2 className="h-5 w-5 text-blue-500 animate-spin mx-auto" />
                                <p className="mt-2 text-xs text-gray-600">Loading items...</p>
                              </div>
                            ) : tradeIn.items && tradeIn.items.length > 0 ? (
                              <div className="bg-white rounded-lg shadow overflow-hidden">
                                <table className="min-w-full">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Card</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Condition</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Qty</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Price</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Type</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {tradeIn.items.map((item, index) => (
                                      <tr key={index} className="border-t border-gray-200">
                                        <td className="px-4 py-2 text-sm">
                                          <p className="font-medium text-gray-900">{item.card_name}</p>
                                          {item.attributes?.isHolo && (
                                            <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">Holo</span>
                                          )}
                                          {item.attributes?.isFirstEdition && (
                                            <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded ml-1">1st Ed</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-700">
                                          {getConditionDisplay(item.condition)}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-700">{item.quantity}</td>
                                        <td className="px-4 py-2 text-sm text-gray-700">${formatCurrency(item.price)}</td>
                                        <td className="px-4 py-2 text-sm">
                                          {item.attributes?.paymentType === 'trade' ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                              <Tag className="h-3 w-3 mr-1" />
                                              Trade
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                              <DollarSign className="h-3 w-3 mr-1" />
                                              Cash
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                          ${formatCurrency(item.price * item.quantity)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-sm italic text-gray-500">No items found</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          
          {getFilteredTradeIns().length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No trade-ins found matching the current filter
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
