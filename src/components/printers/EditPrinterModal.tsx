
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Location, Printer } from '../../types/printer';

interface EditPrinterModalProps {
  printer: Printer;
  locations: Location[];
  onSave: (id: string, printer: Partial<Omit<Printer, 'id' | 'created_at'>>) => Promise<void>;
  onClose: () => void;
}

const EditPrinterModal: React.FC<EditPrinterModalProps> = ({
  printer,
  locations,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: printer.name,
    printer_id: printer.printer_id,
    location_id: printer.location_id,
    printer_type: printer.printer_type,
    is_default: printer.is_default,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.printer_id || !formData.location_id) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(printer.id, formData);
      onClose();
    } catch (error) {
      console.error('Error updating printer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Edit Printer</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Printer Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="printer_id" className="block text-sm font-medium text-gray-700">
              PrintNode Printer ID
            </label>
            <input
              type="text"
              id="printer_id"
              name="printer_id"
              value={formData.printer_id}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="location_id" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <select
              id="location_id"
              name="location_id"
              value={formData.location_id}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select a location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="printer_type" className="block text-sm font-medium text-gray-700">
              Printer Type
            </label>
            <select
              id="printer_type"
              name="printer_type"
              value={formData.printer_type}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="ZPL">ZPL (Zebra/Thermal)</option>
              <option value="RAW">RAW (Standard/PDF)</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_default"
              name="is_default"
              checked={formData.is_default}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700">
              Set as default printer for this location
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Printer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPrinterModal;
