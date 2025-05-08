import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Loader2, AlertCircle, Pencil, Trash2, X, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

interface TradeInItem {
  card_name: string;
  quantity: number;
  price: number;
  condition: string;
}

interface TradeIn {
  id: string;
  trade_in_date: string;
  total_value: number;
  status: 'pending' | 'accepted' | 'rejected';
  staff_notes: string | null;
  items: TradeInItem[];
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  trade_ins?: TradeIn[];
}

interface CustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const CustomerManagement = () => {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerForm | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [loadingTradeIns, setLoadingTradeIns] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !['admin', 'manager'].includes(user.user_metadata.role))) {
      navigate('/dashboard');
      return;
    }

    if (user) {
      fetchCustomers();
    }
  }, [user, loading, navigate]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) throw error;

      setCustomers(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError(error instanceof Error ? error.message : 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerTradeIns = async (customerId: string) => {
    setLoadingTradeIns(true);
    try {
      const { data, error } = await supabase
        .from('trade_ins')
        .select(`
          *,
          items:trade_in_items(
            quantity,
            price,
            condition,
            card:cards(name)
          )
        `)
        .eq('customer_id', customerId)
        .order('trade_in_date', { ascending: false });

      if (error) throw error;

      const tradeIns = data.map(tradeIn => ({
        ...tradeIn,
        items: tradeIn.items.map((item: any) => ({
          card_name: item.card.name,
          quantity: item.quantity,
          price: item.price,
          condition: item.condition
        }))
      }));

      setCustomers(prev => prev.map(customer => 
        customer.id === customerId
          ? { ...customer, trade_ins: tradeIns }
          : customer
      ));
    } catch (error) {
      console.error('Error fetching trade-ins:', error);
      setError('Failed to load trade-in history');
    } finally {
      setLoadingTradeIns(false);
    }
  };

  const toggleCustomerDetails = async (customerId: string) => {
    if (expandedCustomer === customerId) {
      setExpandedCustomer(null);
    } else {
      setExpandedCustomer(customerId);
      const customer = customers.find(c => c.id === customerId);
      if (!customer?.trade_ins) {
        await fetchCustomerTradeIns(customerId);
      }
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer({
      firstName: customer.first_name,
      lastName: customer.last_name,
      email: customer.email || '',
      phone: customer.phone || ''
    });
    setSelectedCustomerId(customer.id);
    setShowEditModal(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !selectedCustomerId) return;

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          first_name: editingCustomer.firstName,
          last_name: editingCustomer.lastName,
          email: editingCustomer.email || null,
          phone: editingCustomer.phone || null
        })
        .eq('id', selectedCustomerId);

      if (error) throw error;

      setCustomers(prev => prev.map(customer => 
        customer.id === selectedCustomerId
          ? {
              ...customer,
              first_name: editingCustomer.firstName,
              last_name: editingCustomer.lastName,
              email: editingCustomer.email || null,
              phone: editingCustomer.phone || null
            }
          : customer
      ));

      setShowEditModal(false);
      setEditingCustomer(null);
      setSelectedCustomerId(null);
      setError(null);
    } catch (error) {
      console.error('Error updating customer:', error);
      setError(error instanceof Error ? error.message : 'Failed to update customer');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This will also delete all their trade-in history.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
      setError(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete customer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
              <p className="mt-4 text-gray-600">Loading customers...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Phone</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Created</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map(customer => (
                    <React.Fragment key={customer.id}>
                      <tr>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleCustomerDetails(customer.id)}
                            className="flex items-center text-left group"
                          >
                            {expandedCustomer === customer.id ? (
                              <ChevronUp className="h-4 w-4 mr-2 text-gray-400 group-hover:text-gray-600" />
                            ) : (
                              <ChevronDown className="h-4 w-4 mr-2 text-gray-400 group-hover:text-gray-600" />
                            )}
                            <span className="font-medium text-gray-900 group-hover:text-blue-600">
                              {customer.first_name} {customer.last_name}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-600">{customer.email || '-'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-600">{customer.phone || '-'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-600">
                            {new Date(customer.created_at).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditCustomer(customer)}
                              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                              title="Edit customer"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Delete customer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedCustomer === customer.id && (
                        <tr>
                          <td colSpan={5} className="py-4 px-4 bg-gray-50">
                            <div className="pl-6">
                              <h3 className="text-sm font-medium text-gray-900 mb-4">Trade-In History</h3>
                              {loadingTradeIns ? (
                                <div className="text-center py-4">
                                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin mx-auto" />
                                  <p className="mt-2 text-sm text-gray-600">Loading trade-ins...</p>
                                </div>
                              ) : customer.trade_ins && customer.trade_ins.length > 0 ? (
                                <div className="space-y-4">
                                  {customer.trade_ins.map(tradeIn => (
                                    <div 
                                      key={tradeIn.id}
                                      className={`rounded-lg p-4 ${
                                        tradeIn.status === 'pending'
                                          ? 'bg-white border border-gray-200'
                                          : tradeIn.status === 'accepted'
                                          ? 'bg-green-50 border border-green-100'
                                          : 'bg-red-50 border border-red-100'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                            tradeIn.status === 'pending'
                                              ? 'bg-gray-100 text-gray-700'
                                              : tradeIn.status === 'accepted'
                                              ? 'bg-green-100 text-green-700'
                                              : 'bg-red-100 text-red-700'
                                          }`}>
                                            {tradeIn.status === 'accepted' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                            {tradeIn.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                                            {tradeIn.status}
                                          </span>
                                          <div className="flex items-center text-sm text-gray-500">
                                            <Clock className="h-4 w-4 mr-1" />
                                            {new Date(tradeIn.trade_in_date).toLocaleDateString()}
                                          </div>
                                        </div>
                                        <span className="font-medium text-gray-900">
                                          ${tradeIn.total_value.toFixed(2)}
                                        </span>
                                      </div>

                                      <div className="mt-2 space-y-1">
                                        {tradeIn.items.map((item, index) => (
                                          <div key={index} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">
                                              {item.quantity}x {item.card_name} ({item.condition})
                                            </span>
                                            <span className="text-gray-900">
                                              ${(item.price * item.quantity).toFixed(2)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>

                                      {tradeIn.staff_notes && (
                                        <div className="mt-2 text-sm text-gray-600 bg-white bg-opacity-50 rounded p-2">
                                          <p className="font-medium text-gray-700">Staff Notes:</p>
                                          <p>{tradeIn.staff_notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No trade-in history found</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>

              {customers.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No customers found
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Customer Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Edit Customer</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCustomer(null);
                  setSelectedCustomerId(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editingCustomer.firstName}
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer,
                        firstName: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editingCustomer.lastName}
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer,
                        lastName: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingCustomer.email}
                    onChange={(e) => setEditingCustomer({
                      ...editingCustomer,
                      email: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editingCustomer.phone}
                    onChange={(e) => setEditingCustomer({
                      ...editingCustomer,
                      phone: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCustomer(null);
                    setSelectedCustomerId(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;