
import React from 'react';
import { Edit, Trash2, MapPin, Printer as PrinterIcon } from 'lucide-react';
import { Printer } from '../../types/printer';

interface PrinterCardProps {
  printer: Printer;
  onEdit: (printer: Printer) => void;
  onDelete: (printerId: string) => void;
}

const PrinterCard: React.FC<PrinterCardProps> = ({ printer, onEdit, onDelete }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <PrinterIcon className="h-8 w-8 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {printer.name}
              </h3>
              {printer.is_default && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Default
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">
              ID: {printer.printer_id}
            </p>
            <div className="flex items-center space-x-1 mt-1">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                {printer.location?.name || 'No location'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            printer.printer_type === 'ZPL' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-orange-100 text-orange-800'
          }`}>
            {printer.printer_type}
          </span>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={() => onEdit(printer)}
          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </button>
        <button
          onClick={() => onDelete(printer.id)}
          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </button>
      </div>
    </div>
  );
};

export default PrinterCard;
