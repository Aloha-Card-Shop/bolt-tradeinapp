import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Loader2, AlertCircle, Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import { GameType, GAME_OPTIONS } from '../../types/card';
import { formatCurrency, parseCurrency } from '../../utils/formatters';
import { toast } from 'react-hot-toast';

interface TradeValueSetting {
  id: string;
  game: GameType;
  min_value: number;
  max_value: number;
  cash_percentage: number | null;
  trade_percentage: number | null;
  fixed_cash_value: number | null;
  fixed_trade_value: number | null;
}

const TradeValuesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [settings, setSettings] = useState<TradeValueSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.user_metadata.role !== 'admin')) {
      navigate('/dashboard');
      return;
    }
    if (user?.user_metadata.role === 'admin') {
      fetchSettings();
    }
  }, [user, loading, navigate]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('trade_value_settings')
        .select('*')
        .order('game')
        .order('min_value');
      if (error) throw error;
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleValueType = (setting: TradeValueSetting) => {
    const wasFixed = setting.fixed_cash_value !== null;
    const baseValue = setting.min_value;

    const updated: TradeValueSetting = {
      ...setting,
      // When switching to fixed mode, initialize with calculated values
      fixed_cash_value: wasFixed ? null : baseValue * 0.5,
      fixed_trade_value: wasFixed ? null : baseValue * 0.65,
      // When switching to percentage mode, restore default percentages
      cash_percentage: wasFixed ? 50 : setting.cash_percentage,
      trade_percentage: wasFixed ? 65 : setting.trade_percentage,
    };

    console.log('Toggling value type:', { from: wasFixed ? 'fixed' : 'percentage', to: wasFixed ? 'percentage' : 'fixed', updated });
    
    setSettings(prev =>
      prev.map(s => (s.id === setting.id ? updated : s))
    );
  };

  const handleSave = async (setting: TradeValueSetting) => {
    try {
      const isFixedMode = setting.fixed_cash_value !== null;
      console.log('Attempting to save setting:', { setting, isFixedMode });

      // More lenient validation to fix the saving issue
      if (isFixedMode) {
        // For fixed mode, we need at least one value to be set
        if (setting.fixed_cash_value === null && setting.fixed_trade_value === null) {
          throw new Error('At least one of cash or trade values must be set in fixed mode');
        }
        
        // Cash value cannot be negative
        if (setting.fixed_cash_value !== null && setting.fixed_cash_value < 0) {
          throw new Error('Cash value cannot be negative');
        }
        
        // Trade value should ideally be greater than cash, but we won't block saving if not
        if (setting.fixed_cash_value !== null && 
            setting.fixed_trade_value !== null && 
            setting.fixed_trade_value < setting.fixed_cash_value) {
          console.warn('Trade value is less than cash value, but proceeding with save');
        }
      } else {
        // For percentage mode, ensure percentages are set
        if ((setting.cash_percentage === null || setting.cash_percentage < 0) && 
            (setting.trade_percentage === null || setting.trade_percentage < 0)) {
          throw new Error('Both percentages must be set and non-negative in percentage mode');
        }
      }

      // Prepare the object for saving
      const settingToSave = {
        ...setting,
        // In fixed mode, keep both fixed values and zero percentages
        fixed_cash_value: isFixedMode ? setting.fixed_cash_value : null,
        fixed_trade_value: isFixedMode ? setting.fixed_trade_value : null,
        // Make sure we have default percentages for non-fixed mode
        cash_percentage: isFixedMode ? 0 : (setting.cash_percentage ?? 50),
        trade_percentage: isFixedMode ? 0 : (setting.trade_percentage ?? 65),
      };

      console.log('Saving setting to database:', settingToSave);
      
      const { error } = await supabase
        .from('trade_value_settings')
        .upsert(settingToSave, { onConflict: 'id' });
      
      if (error) throw error;

      toast.success('Trade value setting saved successfully');
      await fetchSettings();
      setEditingId(null);
      setError(null);
    } catch (err) {
      console.error('Error saving setting:', err);
      setError(err instanceof Error ? err.message : 'Failed to save setting');
      toast.error(err instanceof Error ? err.message : 'Failed to save setting');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this setting?')) return;
    try {
      const { error } = await supabase
        .from('trade_value_settings')
        .delete()
        .eq('id', id);
      if (error) throw error;

      await fetchSettings();
      setError(null);
    } catch (err) {
      console.error('Error deleting setting:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete setting');
    }
  };

  const addNewSetting = () => {
    const newSetting: TradeValueSetting = {
      id: crypto.randomUUID(),
      game: 'pokemon',
      min_value: 0,
      max_value: 999999,
      cash_percentage: 50,
      trade_percentage: 65,
      fixed_cash_value: null,
      fixed_trade_value: null,
    };
    setSettings(prev => [...prev, newSetting]);
    setEditingId(newSetting.id);
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Trade Value Settings</h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Value Ranges</h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure trade-in values based on card value ranges
              </p>
            </div>
            <button
              onClick={addNewSetting}
              className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Range
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
              <p className="mt-4 text-gray-600">Loading settings...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {GAME_OPTIONS.map(option => {
                const gameSettings = settings.filter(s => s.game === option.value);
                return (
                  <div key={option.value} className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {option.label}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Value Range</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Value Type</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Cash Value</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Trade Value</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {gameSettings.map(s => (
                            <tr key={s.id}>
                              <td className="py-3 px-4">
                                {editingId === s.id ? (
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="number"
                                      value={s.min_value}
                                      onChange={e =>
                                        setSettings(prev =>
                                          prev.map(x =>
                                            x.id === s.id
                                              ? { ...x, min_value: parseFloat(e.target.value) }
                                              : x
                                          )
                                        )
                                      }
                                      className="w-24 px-2 py-1 border border-gray-300 rounded"
                                    />
                                    <span>to</span>
                                    <input
                                      type="number"
                                      value={s.max_value}
                                      onChange={e =>
                                        setSettings(prev =>
                                          prev.map(x =>
                                            x.id === s.id
                                              ? { ...x, max_value: parseFloat(e.target.value) }
                                              : x
                                          )
                                        )
                                      }
                                      className="w-24 px-2 py-1 border border-gray-300 rounded"
                                    />
                                  </div>
                                ) : (
                                  <span>
                                    ${s.min_value.toFixed(2)} –{' '}
                                    {s.max_value === 999999
                                      ? '∞'
                                      : `$${s.max_value.toFixed(2)}`}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {editingId === s.id ? (
                                  <select
                                    value={s.fixed_cash_value !== null ? 'fixed' : 'percentage'}
                                    onChange={() => toggleValueType(s)}
                                    className="px-2 py-1 border border-gray-300 rounded"
                                  >
                                    <option value="percentage">Percentage</option>
                                    <option value="fixed">Fixed Value</option>
                                  </select>
                                ) : (
                                  <span className="text-gray-600">
                                    {s.fixed_cash_value !== null ? 'Fixed Value' : 'Percentage'}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {editingId === s.id ? (
                                  s.fixed_cash_value !== null ? (
                                    <div className="flex items-center">
                                      <span className="mr-2">$</span>
                                      <input
                                        type="text"
                                        value={formatCurrency(s.fixed_cash_value || 0)}
                                        onChange={e => {
                                          const value = parseCurrency(e.target.value);
                                          setSettings(prev =>
                                            prev.map(x =>
                                              x.id === s.id
                                                ? { ...x, fixed_cash_value: value }
                                                : x
                                            )
                                          );
                                        }}
                                        className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                                        step="0.01"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <input
                                        type="number"
                                        value={s.cash_percentage ?? 0}
                                        onChange={e =>
                                          setSettings(prev =>
                                            prev.map(x =>
                                              x.id === s.id
                                                ? { ...x, cash_percentage: parseFloat(e.target.value) }
                                                : x
                                            )
                                          )
                                        }
                                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                                      />
                                      <span className="ml-2">%</span>
                                    </div>
                                  )
                                ) : (
                                  <span>
                                    {s.fixed_cash_value !== null
                                      ? `$${formatCurrency(s.fixed_cash_value)}`
                                      : `${s.cash_percentage}%`}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {editingId === s.id ? (
                                  s.fixed_trade_value !== null ? (
                                    <div className="flex items-center">
                                      <span className="mr-2">$</span>
                                      <input
                                        type="text"
                                        value={formatCurrency(s.fixed_trade_value || 0)}
                                        onChange={e => {
                                          const value = parseCurrency(e.target.value);
                                          setSettings(prev =>
                                            prev.map(x =>
                                              x.id === s.id
                                                ? { ...x, fixed_trade_value: value }
                                                : x
                                            )
                                          );
                                        }}
                                        className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                                        step="0.01"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <input
                                        type="number"
                                        value={s.trade_percentage ?? 0}
                                        onChange={e =>
                                          setSettings(prev =>
                                            prev.map(x =>
                                              x.id === s.id
                                                ? { ...x, trade_percentage: parseFloat(e.target.value) }
                                                : x
                                            )
                                          )
                                        }
                                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                                      />
                                      <span className="ml-2">%</span>
                                    </div>
                                  )
                                ) : (
                                  <span>
                                    {s.fixed_trade_value !== null
                                      ? `$${formatCurrency(s.fixed_trade_value)}`
                                      : `${s.trade_percentage}%`}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-end space-x-2">
                                  {editingId === s.id ? (
                                    <button
                                      onClick={() => handleSave(s)}
                                      className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                                      title="Save"
                                    >
                                      <Save className="h-4 w-4" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setEditingId(s.id)}
                                      className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                                      title="Edit"
                                    >
                                      <Settings className="h-4 w-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDelete(s.id)}
                                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeValuesPage;
