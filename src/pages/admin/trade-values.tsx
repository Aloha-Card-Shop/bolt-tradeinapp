
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

interface ValidationErrors {
  [key: string]: {
    min_value?: string;
    max_value?: string;
    cash_percentage?: string;
    trade_percentage?: string;
    fixed_cash_value?: string;
    fixed_trade_value?: string;
    range?: string;
  };
}

const TradeValuesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [settings, setSettings] = useState<TradeValueSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

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
      setHasUnsavedChanges(false);
      // Validate settings after fetching
      validateAllSettings(data);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const validateSetting = (setting: TradeValueSetting, allSettings: TradeValueSetting[]): {
    isValid: boolean;
    errors: { [key: string]: string };
  } => {
    const errors: { [key: string]: string } = {};
    
    // Check min_value < max_value
    if (setting.min_value >= setting.max_value) {
      errors.min_value = 'Min value must be less than max value';
      errors.max_value = 'Max value must be greater than min value';
    }

    // Check percentage ranges for non-fixed mode
    const isFixedMode = setting.fixed_cash_value !== null || setting.fixed_trade_value !== null;
    
    if (!isFixedMode) {
      // Validate cash_percentage
      if (setting.cash_percentage === null) {
        errors.cash_percentage = 'Cash percentage is required';
      } else if (setting.cash_percentage < 0 || setting.cash_percentage > 100) {
        errors.cash_percentage = 'Must be between 0 and 100';
      }
      
      // Validate trade_percentage
      if (setting.trade_percentage === null) {
        errors.trade_percentage = 'Trade percentage is required';
      } else if (setting.trade_percentage < 0 || setting.trade_percentage > 100) {
        errors.trade_percentage = 'Must be between 0 and 100';
      }
    } else {
      // In fixed mode, ensure at least one value is set
      if (setting.fixed_cash_value === null && setting.fixed_trade_value === null) {
        errors.fixed_cash_value = 'At least one value must be set';
        errors.fixed_trade_value = 'At least one value must be set';
      }
    }

    // Check for overlapping ranges with same game
    const overlaps = allSettings.filter(s => 
      s.id !== setting.id && 
      s.game === setting.game && 
      ((setting.min_value >= s.min_value && setting.min_value <= s.max_value) ||
       (setting.max_value >= s.min_value && setting.max_value <= s.max_value) ||
       (setting.min_value <= s.min_value && setting.max_value >= s.max_value))
    );

    if (overlaps.length > 0) {
      errors.range = 'Range overlaps with another range for the same game';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const validateAllSettings = (settingsToValidate: TradeValueSetting[] = settings) => {
    const newValidationErrors: ValidationErrors = {};

    settingsToValidate.forEach(setting => {
      const { isValid, errors } = validateSetting(setting, settingsToValidate);
      if (!isValid) {
        newValidationErrors[setting.id] = errors;
      }
    });

    setValidationErrors(newValidationErrors);
    return Object.keys(newValidationErrors).length === 0;
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
    
    setSettings(prev =>
      prev.map(s => (s.id === setting.id ? updated : s))
    );
    
    // Validate the updated setting
    const updatedSettings = settings.map(s => s.id === setting.id ? updated : s);
    validateAllSettings(updatedSettings);
    
    setHasUnsavedChanges(true);
  };

  const handleSave = async (setting: TradeValueSetting) => {
    // Validate before saving
    const { isValid, errors } = validateSetting(setting, settings);
    
    if (!isValid) {
      setValidationErrors(prev => ({
        ...prev,
        [setting.id]: errors
      }));
      toast.error('Please fix validation errors before saving');
      return;
    }

    try {
      const isFixedMode = setting.fixed_cash_value !== null;
      
      // Prepare the object for saving
      const settingToSave = {
        ...setting,
        fixed_cash_value: isFixedMode ? setting.fixed_cash_value : null,
        fixed_trade_value: isFixedMode ? setting.fixed_trade_value : null,
        cash_percentage: isFixedMode ? 0 : (setting.cash_percentage ?? 50),
        trade_percentage: isFixedMode ? 0 : (setting.trade_percentage ?? 65),
      };
      
      const { error } = await supabase
        .from('trade_value_settings')
        .upsert(settingToSave, { onConflict: 'id' });
      
      if (error) throw error;

      toast.success('Trade value setting saved successfully');
      await fetchSettings();
      setEditingId(null);
      setError(null);
      setHasUnsavedChanges(false);
      
      // Clear validation errors for this setting
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[setting.id];
        return newErrors;
      });
    } catch (err) {
      console.error('Error saving setting:', err);
      setError(err instanceof Error ? err.message : 'Failed to save setting');
      toast.error(err instanceof Error ? err.message : 'Failed to save setting');
    }
  };

  const saveAllSettings = async () => {
    // Validate all settings before saving
    const isValid = validateAllSettings();
    
    if (!isValid) {
      toast.error('Please fix all validation errors before saving');
      return;
    }

    setIsLoading(true);
    let hasError = false;

    for (const setting of settings) {
      try {
        const isFixedMode = setting.fixed_cash_value !== null;
        
        // Prepare the object for saving with proper defaults
        const settingToSave = {
          ...setting,
          fixed_cash_value: isFixedMode ? setting.fixed_cash_value : null,
          fixed_trade_value: isFixedMode ? setting.fixed_trade_value : null,
          cash_percentage: isFixedMode ? 0 : (setting.cash_percentage ?? 50),
          trade_percentage: isFixedMode ? 0 : (setting.trade_percentage ?? 65),
        };
        
        const { error } = await supabase
          .from('trade_value_settings')
          .upsert(settingToSave, { onConflict: 'id' });
        
        if (error) {
          console.error('Error during bulk save for setting:', setting.id, error);
          hasError = true;
        }
      } catch (err) {
        console.error('Error processing setting during bulk save:', setting.id, err);
        hasError = true;
      }
    }
    
    setIsLoading(false);
    
    if (hasError) {
      toast.error('Some settings could not be saved. Please check and try again.');
    } else {
      toast.success('All trade value settings saved successfully');
      setHasUnsavedChanges(false);
      setValidationErrors({});
    }
    
    // Refresh settings to get the latest state
    await fetchSettings();
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
    
    const updatedSettings = [...settings, newSetting];
    setSettings(updatedSettings);
    
    // Validate the new setting
    validateAllSettings(updatedSettings);
    
    setEditingId(newSetting.id);
    setHasUnsavedChanges(true);
  };

  const handleSettingChange = (updatedSetting: TradeValueSetting) => {
    const newSettings = settings.map(s => 
      s.id === updatedSetting.id ? updatedSetting : s
    );
    
    setSettings(newSettings);
    
    // Validate the changed setting
    const { isValid, errors } = validateSetting(updatedSetting, newSettings);
    
    setValidationErrors(prev => ({
      ...prev,
      [updatedSetting.id]: isValid ? undefined : errors
    }));
    
    setHasUnsavedChanges(true);
  };

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

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
            onClick={() => navigate('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Admin
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
            <div className="flex space-x-3">
              {hasUnsavedChanges && (
                <button
                  onClick={saveAllSettings}
                  disabled={isLoading || hasValidationErrors}
                  className={`flex items-center px-4 py-2 text-white rounded-lg ${
                    hasValidationErrors 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save All Changes
                </button>
              )}
              <button
                onClick={addNewSetting}
                className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Range
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {hasValidationErrors && (
            <div className="mb-6 p-4 bg-amber-50 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-700">
                There are validation errors that must be fixed before saving. Please check the highlighted fields.
              </p>
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
                          {gameSettings.map(s => {
                            const errors = validationErrors[s.id] || {};
                            const hasRangeError = !!errors.range;
                            
                            return (
                              <tr key={s.id} className={hasRangeError ? 'bg-red-50' : ''}>
                                <td className="py-3 px-4">
                                  {editingId === s.id ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <div className="flex flex-col">
                                          <input
                                            type="number"
                                            value={s.min_value}
                                            onChange={e => {
                                              const newValue = parseFloat(e.target.value);
                                              handleSettingChange({
                                                ...s,
                                                min_value: isNaN(newValue) ? 0 : newValue
                                              });
                                            }}
                                            className={`w-24 px-2 py-1 border rounded ${
                                              errors.min_value ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                          />
                                          {errors.min_value && (
                                            <span className="text-xs text-red-500 mt-1">{errors.min_value}</span>
                                          )}
                                        </div>
                                        <span>to</span>
                                        <div className="flex flex-col">
                                          <input
                                            type="number"
                                            value={s.max_value}
                                            onChange={e => {
                                              const newValue = parseFloat(e.target.value);
                                              handleSettingChange({
                                                ...s,
                                                max_value: isNaN(newValue) ? 0 : newValue
                                              });
                                            }}
                                            className={`w-24 px-2 py-1 border rounded ${
                                              errors.max_value ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                          />
                                          {errors.max_value && (
                                            <span className="text-xs text-red-500 mt-1">{errors.max_value}</span>
                                          )}
                                        </div>
                                      </div>
                                      {hasRangeError && (
                                        <span className="text-xs text-red-500 block">{errors.range}</span>
                                      )}
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
                                      <div className="flex flex-col">
                                        <div className="flex items-center">
                                          <span className="mr-2">$</span>
                                          <input
                                            type="text"
                                            value={formatCurrency(s.fixed_cash_value || 0)}
                                            onChange={e => {
                                              const value = parseCurrency(e.target.value);
                                              handleSettingChange({
                                                ...s,
                                                fixed_cash_value: value
                                              });
                                            }}
                                            className={`w-24 px-2 py-1 border rounded text-right ${
                                              errors.fixed_cash_value ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            step="0.01"
                                          />
                                        </div>
                                        {errors.fixed_cash_value && (
                                          <span className="text-xs text-red-500 mt-1">{errors.fixed_cash_value}</span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex flex-col">
                                        <div className="flex items-center">
                                          <input
                                            type="number"
                                            value={s.cash_percentage ?? 0}
                                            onChange={e => {
                                              const newValue = parseFloat(e.target.value);
                                              handleSettingChange({
                                                ...s,
                                                cash_percentage: isNaN(newValue) ? 0 : newValue
                                              });
                                            }}
                                            className={`w-20 px-2 py-1 border rounded ${
                                              errors.cash_percentage ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                          />
                                          <span className="ml-2">%</span>
                                        </div>
                                        {errors.cash_percentage && (
                                          <span className="text-xs text-red-500 mt-1">{errors.cash_percentage}</span>
                                        )}
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
                                      <div className="flex flex-col">
                                        <div className="flex items-center">
                                          <span className="mr-2">$</span>
                                          <input
                                            type="text"
                                            value={formatCurrency(s.fixed_trade_value || 0)}
                                            onChange={e => {
                                              const value = parseCurrency(e.target.value);
                                              handleSettingChange({
                                                ...s,
                                                fixed_trade_value: value
                                              });
                                            }}
                                            className={`w-24 px-2 py-1 border rounded text-right ${
                                              errors.fixed_trade_value ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            step="0.01"
                                          />
                                        </div>
                                        {errors.fixed_trade_value && (
                                          <span className="text-xs text-red-500 mt-1">{errors.fixed_trade_value}</span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex flex-col">
                                        <div className="flex items-center">
                                          <input
                                            type="number"
                                            value={s.trade_percentage ?? 0}
                                            onChange={e => {
                                              const newValue = parseFloat(e.target.value);
                                              handleSettingChange({
                                                ...s,
                                                trade_percentage: isNaN(newValue) ? 0 : newValue
                                              });
                                            }}
                                            className={`w-20 px-2 py-1 border rounded ${
                                              errors.trade_percentage ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                          />
                                          <span className="ml-2">%</span>
                                        </div>
                                        {errors.trade_percentage && (
                                          <span className="text-xs text-red-500 mt-1">{errors.trade_percentage}</span>
                                        )}
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
                                        disabled={!!validationErrors[s.id]}
                                        className={`p-1 rounded ${
                                          validationErrors[s.id]
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                        }`}
                                        title={validationErrors[s.id] ? "Fix validation errors first" : "Save"}
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
                            );
                          })}
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
