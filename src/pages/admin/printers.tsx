import React, { useState } from 'react';
import { Download, Plus, Settings, MapPin } from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import SettingsForm from '../../components/barcode/SettingsForm';
import AddPrinterModal from '../../components/printers/AddPrinterModal';
import AddLocationModal from '../../components/printers/AddLocationModal';
import EditPrinterModal from '../../components/printers/EditPrinterModal';
import { usePrinters } from '../../hooks/usePrinters';
import { Printer } from '../../types/printer';
import TestDownloadModal from '../../components/barcode/TestDownloadModal';

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
            Download Settings
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Barcode Templates
          </button>
        </nav>
      </div>

      {activeTab === 'printers' && (
        <div className="space-y-6">
          {/* Download Options */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Download Preferences</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowTestModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Test Download
              </button>
            </div>
          </div>

          {/* Download Settings Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Default Download Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Format
                </label>
                <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="png">PNG (High Quality Image)</option>
                  <option value="pdf">PDF (Print Ready)</option>
                  <option value="svg">SVG (Vector Graphics)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Label Size
                </label>
                <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="2x1">2" x 1" (Standard)</option>
                  <option value="4x2">4" x 2" (Large)</option>
                  <option value="custom">Custom Size</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality
                </label>
                <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="0.9">High (90%)</option>
                  <option value="0.8">Medium (80%)</option>
                  <option value="0.7">Standard (70%)</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex items-center space-x-4">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Include customer information</span>
              </label>
              
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-700">Auto-download after trade-in</span>
              </label>
            </div>
            
            <div className="mt-6">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Save Preferences
              </button>
            </div>
          </div>

          {/* Benefits Card */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-green-800 mb-3">Benefits of Downloadable Barcodes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm">No internet required for printing</span>
                </div>
                <div className="flex items-center text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm">Print on any standard printer</span>
                </div>
                <div className="flex items-center text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm">Save labels for future use</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm">Multiple format options (PNG, PDF, SVG)</span>
                </div>
                <div className="flex items-center text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm">Batch download multiple labels</span>
                </div>
                <div className="flex items-center text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm">No monthly subscription fees</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Barcode Templates</h2>
            <button
              onClick={() => setShowTestModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Test Template
            </button>
          </div>
          <SettingsForm onSave={handleSaveSettings} />
        </div>
      )}

      {/* Modals */}
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

      {/* Test Modal */}
      {showTestModal && (
        <TestDownloadModal onClose={() => setShowTestModal(false)} />
      )}
    </div>
  );
};

export default PrintersPage;
