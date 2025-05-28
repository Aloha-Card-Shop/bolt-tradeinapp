
import React, { useState } from 'react';
import { Plus, TestTube } from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import SettingsForm from '../../components/barcode/SettingsForm';
import TestPrintModal from '../../components/barcode/TestPrintModal';
import { usePrinters } from '../../hooks/usePrinters';

const PrintersPage: React.FC = () => {
  const { printers, isLoading } = usePrinters();
  const [showTestModal, setShowTestModal] = useState(false);

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Printer Management" 
        description="Configure printers and test printing functionality"
      />
      
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setShowTestModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <TestTube className="h-4 w-4 mr-2" />
          Test Print & Debug
        </button>
      </div>

      <SettingsForm />

      {showTestModal && (
        <TestPrintModal
          printers={printers}
          isLoading={isLoading}
          onClose={() => setShowTestModal(false)}
        />
      )}
    </div>
  );
};

export default PrintersPage;
