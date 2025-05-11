
import React, { useState } from 'react';
import { BarcodeTemplate } from '../../types/barcode';
import { toast } from 'react-hot-toast';

interface TemplateFormProps {
  template?: BarcodeTemplate;
  onSave: (template: Partial<BarcodeTemplate>) => Promise<void>;
  onCancel: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<BarcodeTemplate>>({
    name: template?.name || '',
    description: template?.description || '',
    zpl_template: template?.zpl_template || '',
    is_default: template?.is_default || false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.zpl_template) {
      toast.error('Name and ZPL template are required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(formData);
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Template Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <input
          type="text"
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>
      
      <div>
        <label htmlFor="zpl_template" className="block text-sm font-medium text-gray-700">ZPL Template</label>
        <textarea
          id="zpl_template"
          name="zpl_template"
          rows={8}
          value={formData.zpl_template}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Use placeholders: {{'{{'}}customerName{{'}}'}}, {{'{{'}}date{{'}}'}}, {{'{{'}}totalValue{{'}}'}}, {{'{{'}}cashValue{{'}}'}}, {{'{{'}}tradeValue{{'}}'}}, {{'{{'}}tradeInId{{'}}'}}
        </p>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_default"
          name="is_default"
          checked={!!formData.is_default}
          onChange={handleCheckboxChange}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700">
          Set as default template
        </label>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
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
          ) : 'Save Template'}
        </button>
      </div>
    </form>
  );
};

export default TemplateForm;
