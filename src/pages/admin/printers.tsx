
import React, { useState } from 'react';
import { TestTube, Plus, Settings, MapPin } from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import SettingsForm from '../../components/barcode/SettingsForm';
import TestPrintModal from '../../components/barcode/TestPrintModal';
import PrinterCard from '../../components/printers/PrinterCard';
import AddPrinterModal from '../../components/printers/AddPrinterModal';
import AddLocationModal from '../../components/printers/AddLocationModal';
import EditPrinterModal from '../../components/printers/EditPrinterModal';
import { usePrinters } from '../../hooks/usePrinters';
import { Printer } from '../../types/printer';

const PrintersPage: React.FC = () => {
  const {
    printers,
    locations,
    isLoading,
    addPrinter,
    updatePrinter,
    deletePrinter,
    addLocation
  } = usePrinters();

  const [activeTab, setActiveTab] = useState<'printers' | 'settings'>('printers');
  const [showTestModal, setShowTestModal] = useState(false);
  const [showAddPrinterModal, setShowAddPrinterModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showEditPrinterModal, setShowEditPrinterModal] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);

  const handleSaveSettings = async (settings: any) => {
    // TODO: Implement settings save functionality
    console.log('Saving printer settings:', settings);
  };

  const handleEditPrinter = (printer: Printer) => {
    setSelectedPrinter(printer);
    setShowEditPrinterModal(true);
  };

  const handleDeletePrinter = async (printerId: string) => {
    if (window.confirm('Are you sure you want to delete this printer?')) {
      await deletePrinter(printerId);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader />
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('printers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'printers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Printers & Locations
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Barcode Settings
          </button>
        </nav>
      </div>

      {activeTab === 'printers' && (
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Printer Management</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddLocationModal(true)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Add Location
              </button>
              <button
                onClick={() => setShowAddPrinterModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Printer
              </button>
              <button
                onClick={() => setShowTestModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Print & Debug
              </button>
            </div>
          </div>

          {/* Locations Summary */}
          {locations.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Locations ({locations.length})</h3>
              <div className="flex flex-wrap gap-2">
                {locations.map((location) => (
                  <span
                    key={location.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {location.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Printers Grid */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Loading printers...</p>
            </div>
          ) : printers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Settings className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No printers configured</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first printer.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddPrinterModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Printer
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {printers.map((printer) => (
                <PrinterCard
                  key={printer.id}
                  printer={printer}
                  onEdit={handleEditPrinter}
                  onDelete={handleDeletePrinter}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Barcode Settings</h2>
            <button
              onClick={() => setShowTestModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Print & Debug
            </button>
          </div>
          <SettingsForm onSave={handleSaveSettings} />
        </div>
      )}

      {/* Modals */}
      {showTestModal && (
        <TestPrintModal
          printers={printers}
          isLoading={isLoading}
          onClose={() => setShowTestModal(false)}
        />
      )}

      {showAddPrinterModal && (
        <AddPrinterModal
          locations={locations}
          onSave={addPrinter}
          onClose={() => setShowAddPrinterModal(false)}
        />
      )}

      {showAddLocationModal && (
        <AddLocationModal
          onSave={addLocation}
          onClose={() => setShowAddLocationModal(false)}
        />
      )}

      {showEditPrinterModal && selectedPrinter && (
        <EditPrinterModal
          printer={selectedPrinter}
          locations={locations}
          onSave={updatePrinter}
          onClose={() => {
            setShowEditPrinterModal(false);
            setSelectedPrinter(null);
          }}
        />
      )}
    </div>
  );
};

export default PrintersPage;
