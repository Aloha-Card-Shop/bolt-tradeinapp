
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowLeft, Loader2, CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import { useTradeValue } from '../../hooks/useTradeValue';
import { GameType } from '../../types/card';

interface TradeInItem {
  card_name: string;
  quantity: number;
  price: number;
  condition: string;
  game: string;
  attributes: {
    paymentType: 'cash' | 'trade';
  };
}

interface TradeIn {
  id: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string | null;
  };
  trade_in_date: string;
  total_value: number;
  status: 'pending' | 'accepted' | 'rejected';
  handled_by: string | null;
  handled_at: string | null;
  staff_notes: string | null;
  items: TradeInItem[];
}

interface TradeInRowProps {
  tradeIn: TradeIn;
  processingId: string | null;
  onDelete: (id: string) => void;
  onHandle: (id: string, status: 'accepted' | 'rejected', notes: string) => void;
}

const TradeInRow: React.FC<TradeInRowProps> = ({ tradeIn, processingId, onDelete, onHandle }) => {
  const [staffNotes, setStaffNotes] = useState('');

  // Calculate separate totals for cash and trade values
  const { totalCashValue, totalTradeValue } = tradeIn.items.reduce((acc, item) => {
    const { tradeValue, cashValue } = useTradeValue(item.game as GameType, item.price);
    const value = item.attributes?.paymentType === 'trade' ? tradeValue : cashValue;
    
    if (item.attributes?.paymentType === 'trade') {
      acc.totalTradeValue += value * item.quantity;
    } else {
      acc.totalCashValue += value * item.quantity;
    }
    
    return acc;
  }, { totalCashValue: 0, totalTradeValue: 0 });

  return (
    <div className="border border-gray-200 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-medium text-gray-900">
            {tradeIn.customer.first_name} {tradeIn.customer.last_name}
          </h3>
          {tradeIn.customer.email && (
            <p className="text-sm text-gray-600 mt-1">{tradeIn.customer.email}</p>
          )}
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <Clock className="h-4 w-4 mr-1" />
            {new Date(tradeIn.trade_in_date).toLocaleDateString()}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Values:</p>
          <p className="font-medium text-gray-900">Cash: ${totalCashValue.toFixed(2)}</p>
          <p className="font-medium text-gray-900">Trade: ${totalTradeValue.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">
            {tradeIn.items.length} {tradeIn.items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
        {tradeIn.items.map((item, index) => {
          const { tradeValue, cashValue } = useTradeValue(item.game as GameType, item.price);
          const value = item.attributes?.paymentType === 'trade' ? tradeValue : cashValue;

          return (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {item.quantity}x {item.card_name} ({item.condition})
                <span className="ml-2 text-xs text-gray-500">
                  {item.attributes?.paymentType === 'trade' ? '(Trade)' : '(Cash)'}
                </span>
              </span>
              <span className="font-medium">
                ${(value * item.quantity).toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-100 pt-4 mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Staff Notes
        </label>
        <textarea
          value={staffNotes}
          onChange={(e) => setStaffNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="Add any notes about this trade-in..."
        />
      </div>

      <div className="flex items-center justify-end space-x-3 mt-4">
        <button
          onClick={() => onDelete(tradeIn.id)}
          disabled={processingId === tradeIn.id}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processingId === tradeIn.id ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <div className="flex items-center">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </div>
          )}
        </button>
        <button
          onClick={() => onHandle(tradeIn.id, 'rejected', staffNotes)}
          disabled={processingId === tradeIn.id}
          className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processingId === tradeIn.id ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Reject'
          )}
        </button>
        <button
          onClick={() => onHandle(tradeIn.id, 'accepted', staffNotes)}
          disabled={processingId === tradeIn.id}
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processingId === tradeIn.id ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Accept'
          )}
        </button>
      </div>
    </div>
  );
};

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !['admin', 'manager'].includes(user.user_metadata.role))) {
      navigate('/dashboard');
      return;
    }

    if (user && ['admin', 'manager'].includes(user.user_metadata.role)) {
      fetchTradeIns();
    }
  }, [user, loading, navigate]);

  const fetchTradeIns = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('trade_ins')
        .select(`
          *,
          customer:customers(first_name, last_name, email),
          items:trade_in_items(
            quantity,
            price,
            condition,
            attributes,
            card:cards(name, game)
          )
        `)
        .order('trade_in_date', { ascending: false });

      if (error) throw error;

      const formattedTradeIns = data.map(tradeIn => ({
        ...tradeIn,
        items: tradeIn.items.map((item: any) => ({
          card_name: item.card.name,
          game: item.card.game,
          quantity: item.quantity,
          price: item.price,
          condition: item.condition,
          attributes: item.attributes || { paymentType: 'cash' }
        }))
      }));

      setTradeIns(formattedTradeIns);
      setError(null);
    } catch (error) {
      console.error('Error fetching trade-ins:', error);
      setError('Failed to load trade-ins');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTradeIn = async (tradeInId: string, status: 'accepted' | 'rejected', notes: string) => {
    setProcessingId(tradeInId);
    try {
      const { error } = await supabase
        .from('trade_ins')
        .update({
          status,
          handled_by: user?.id,
          handled_at: new Date().toISOString(),
          staff_notes: notes.trim() || null
        })
        .eq('id', tradeInId);

      if (error) throw error;

      setTradeIns(prev => prev.map(tradeIn => 
        tradeIn.id === tradeInId
          ? {
              ...tradeIn,
              status,
              handled_by: user?.id || null,
              handled_at: new Date().toISOString(),
              staff_notes: notes.trim() || null
            }
          : tradeIn
      ));
      
      setError(null);
    } catch (error) {
      console.error('Error updating trade-in:', error);
      setError('Failed to update trade-in');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteTradeIn = async (tradeInId: string) => {
    if (!confirm('Are you sure you want to delete this trade-in? This action cannot be undone.')) {
      return;
    }

    setProcessingId(tradeInId);
    setError(null);

    try {
      const { error } = await supabase
        .from('trade_ins')
        .delete()
        .eq('id', tradeInId);

      if (error) throw error;

      setTradeIns(prev => prev.filter(tradeIn => tradeIn.id !== tradeInId));
      setError(null);
    } catch (error) {
      console.error('Error deleting trade-in:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete trade-in');
    } finally {
      setProcessingId(null);
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

  const pendingTradeIns = tradeIns.filter(t => t.status === 'pending');
  const processedTradeIns = tradeIns.filter(t => t.status !== 'pending');

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
              <ClipboardList className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Trade-In Management</h1>
          </div>
        </div>

        <div className="space-y-8">
          {/* Pending Trade-Ins */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Pending Trade-Ins ({pendingTradeIns.length})
            </h2>
            
            <div className="space-y-6">
              {pendingTradeIns.map(tradeIn => (
                <TradeInRow
                  key={tradeIn.id}
                  tradeIn={tradeIn}
                  processingId={processingId}
                  onDelete={handleDeleteTradeIn}
                  onHandle={handleTradeIn}
                />
              ))}

              {pendingTradeIns.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No pending trade-ins
                </p>
              )}
            </div>
          </div>

          {/* Past Trade-Ins */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Past Trade-Ins ({processedTradeIns.length})
            </h2>
            
            <div className="space-y-6">
              {processedTradeIns.map(tradeIn => {
                // Calculate separate totals for cash and trade values
                const { totalCashValue, totalTradeValue } = tradeIn.items.reduce((acc, item) => {
                  const { tradeValue, cashValue } = useTradeValue(item.game as GameType, item.price);
                  const value = item.attributes?.paymentType === 'trade' ? tradeValue : cashValue;
                  
                  if (item.attributes?.paymentType === 'trade') {
                    acc.totalTradeValue += value * item.quantity;
                  } else {
                    acc.totalCashValue += value * item.quantity;
                  }
                  
                  return acc;
                }, { totalCashValue: 0, totalTradeValue: 0 });

                return (
                  <div 
                    key={tradeIn.id} 
                    className={`border rounded-xl p-6 ${
                      tradeIn.status === 'accepted' 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">
                            {tradeIn.customer.first_name} {tradeIn.customer.last_name}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            tradeIn.status === 'accepted'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {tradeIn.status === 'accepted' ? (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {tradeIn.status}
                          </span>
                        </div>
                        {tradeIn.customer.email && (
                          <p className="text-sm text-gray-600 mt-1">{tradeIn.customer.email}</p>
                        )}
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(tradeIn.trade_in_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Values:</p>
                        <p className="font-medium text-gray-900">Cash: ${totalCashValue.toFixed(2)}</p>
                        <p className="font-medium text-gray-900">Trade: ${totalTradeValue.toFixed(2)}</p>
                      </div>
                    </div>

                    {tradeIn.staff_notes && (
                      <div className="mt-4 text-sm text-gray-600 bg-white bg-opacity-50 rounded-lg p-3">
                        <p className="font-medium text-gray-700">Staff Notes:</p>
                        <p className="mt-1">{tradeIn.staff_notes}</p>
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
                      {tradeIn.items.map((item, index) => {
                        const { tradeValue, cashValue } = useTradeValue(item.game as GameType, item.price);
                        const value = item.attributes?.paymentType === 'trade' ? tradeValue : cashValue;

                        return (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {item.quantity}x {item.card_name} ({item.condition})
                              <span className="ml-2 text-xs text-gray-500">
                                {item.attributes?.paymentType === 'trade' ? '(Trade)' : '(Cash)'}
                              </span>
                            </span>
                            <span className="font-medium">
                              ${(value * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {processedTradeIns.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No processed trade-ins
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
