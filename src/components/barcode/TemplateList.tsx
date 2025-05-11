
import React from 'react';
import { BarcodeTemplate } from '../../types/barcode';
import { Pencil, Trash2, CheckCircle } from 'lucide-react';

interface TemplateListProps {
  templates: BarcodeTemplate[];
  onEdit: (template: BarcodeTemplate) => void;
  onDelete: (template: BarcodeTemplate) => void;
}

const TemplateList: React.FC<TemplateListProps> = ({ templates, onEdit, onDelete }) => {
  if (templates.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No templates found. Create a new template to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {templates.map((template) => (
            <tr key={template.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{template.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.description || '--'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {template.is_default && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {template.created_at ? new Date(template.created_at).toLocaleDateString() : '--'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(template)}
                  className="text-blue-600 hover:text-blue-900 mr-4"
                  title="Edit template"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {!template.is_default && (
                  <button
                    onClick={() => onDelete(template)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TemplateList;
