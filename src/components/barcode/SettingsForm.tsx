
import React, { useState, useEffect } from 'react';
import { BarcodeSetting } from '../../types/barcode';

interface SettingsFormProps {
  settings?: BarcodeSetting | null;
  onSave: (settings: Partial<BarcodeSetting['setting_value']>) => Promise<void>;
}

const SettingsForm: React.FC<SettingsFormProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<BarcodeSetting['setting_value']>({
    barcodeType: 'CODE128',
    width: 2,
    height: 100,
    fontSize: 12,
    includeCustomerName: true,
    includeDate: true,
    includeValue: true,
    labelWidth: '2in',
    labelHeight: '1in'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (settings?.setting_value) {
      setFormData(settings.setting_value);
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="barcodeType" className="block text-sm font-medium text-gray-700">Barcode Type</label>
          <select
            id="barcodeType"
            name="barcodeType"
            value={formData.barcodeType}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="CODE128">CODE128</option>
            <option value="CODE39">CODE39</option>
            <option value="EAN13">EAN13</option>
            <option value="UPC">UPC</option>
            <option value="QR">QR Code</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="fontSize" className="block text-sm font-medium text-gray-700">Font Size</label>
          <input
            type="number"
            id="fontSize"
            name="fontSize"
            value={formData.fontSize}
            onChange={handleChange}
            min="8"
            max="24"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="width" className="block text-sm font-medium text-gray-700">Barcode Width</label>
          <input
            type="number"
            id="width"
            name="width"
            value={formData.width}
            onChange={handleChange}
            min="1"
            max="5"
            step="0.5"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="height" className="block text-sm font-medium text-gray-700">Barcode Height</label>
          <input
            type="number"
            id="height"
            name="height"
            value={formData.height}
            onChange={handleChange}
            min="50"
            max="200"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="labelWidth" className="block text-sm font-medium text-gray-700">Label Width</label>
          <input
            type="text"
            id="labelWidth"
            name="labelWidth"
            value={formData.labelWidth}
            onChange={handleChange}
            placeholder="2in"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="labelHeight" className="block text-sm font-medium text-gray-700">Label Height</label>
          <input
            type="text"
            id="labelHeight"
            name="labelHeight"
            value={formData.labelHeight}
            onChange={handleChange}
            placeholder="1in"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Content Options</div>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeCustomerName"
              name="includeCustomerName"
              checked={formData.includeCustomerName}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="includeCustomerName" className="ml-2 block text-sm text-gray-700">Include Customer Name</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeDate"
              name="includeDate"
              checked={formData.includeDate}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="includeDate" className="ml-2 block text-sm text-gray-700">Include Date</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeValue"
              name="includeValue"
              checked={formData.includeValue}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="includeValue" className="ml-2 block text-sm text-gray-700">Include Value</label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isSubmitting ? (
            <>
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-t-white border-r-white border-b-transparent border-l-transparent mr-2"></span>
              Saving...
            </>
          ) : 'Save Settings'}
        </button>
      </div>
    </form>
  );
};

export default SettingsForm;
