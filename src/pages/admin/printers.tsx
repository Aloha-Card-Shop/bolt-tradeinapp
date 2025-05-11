
import React, { useState } from 'react';
import { PlusCircle, Trash, Save, Edit, Printer } from 'lucide-react';
import { usePrinters } from '../../hooks/usePrinters';

const PrintersAdminPage: React.FC = () => {
  const { printers, locations, isLoading, addPrinter, updatePrinter, deletePrinter, addLocation, updateLocation, deleteLocation } = usePrinters();
  const [newPrinter, setNewPrinter] = useState({ name: '', printer_id: '', location_id: '', is_default: false });
  const [newLocation, setNewLocation] = useState({ name: '', address: '' });
  const [editingPrinter, setEditingPrinter] = useState<{ id: string; name: string; printer_id: string; location_id: string; is_default: boolean } | null>(null);
  const [editingLocation, setEditingLocation] = useState<{ id: string; name: string; address: string } | null>(null);

  // Handle printer form submission
  const handlePrinterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPrinter) {
        await updatePrinter(editingPrinter.id, {
          name: editingPrinter.name,
          printer_id: editingPrinter.printer_id,
          location_id: editingPrinter.location_id,
          is_default: editingPrinter.is_default
        });
        setEditingPrinter(null);
      } else {
        if (!newPrinter.location_id && locations.length > 0) {
          newPrinter.location_id = locations[0].id;
        }
        await addPrinter(newPrinter);
        setNewPrinter({ name: '', printer_id: '', location_id: newPrinter.location_id, is_default: false });
      }
    } catch (error) {
      console.error('Error submitting printer:', error);
    }
  };

  // Handle location form submission
  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, {
          name: editingLocation.name,
          address: editingLocation.address
        });
        setEditingLocation(null);
      } else {
        await addLocation(newLocation);
        setNewLocation({ name: '', address: '' });
      }
    } catch (error) {
      console.error('Error submitting location:', error);
    }
  };

  // Handle printer deletion
  const handleDeletePrinter = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this printer?')) {
      try {
        await deletePrinter(id);
      } catch (error) {
        console.error('Error deleting printer:', error);
      }
    }
  };

  // Handle location deletion
  const handleDeleteLocation = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await deleteLocation(id);
      } catch (error) {
        console.error('Error deleting location:', error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Printer & Location Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Locations Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium mb-4 flex items-center">
            <span className="mr-2">📍</span> Locations
          </h2>

          {/* Locations List */}
          <div className="mb-6">
            {locations.length === 0 ? (
              <p className="text-gray-500 italic">No locations added yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map((location) => (
                      <tr key={location.id} className="border-t border-gray-200">
                        <td className="px-4 py-2">{location.name}</td>
                        <td className="px-4 py-2">{location.address || '-'}</td>
                        <td className="px-4 py-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingLocation({ 
                                id: location.id, 
                                name: location.name, 
                                address: location.address || '' 
                              })}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Edit Location"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteLocation(location.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Delete Location"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add/Edit Location Form */}
          <form onSubmit={handleLocationSubmit} className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-3">
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </h3>
            <div className="mb-3">
              <label htmlFor="location-name" className="block text-sm font-medium text-gray-700 mb-1">
                Location Name *
              </label>
              <input
                id="location-name"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={editingLocation ? editingLocation.name : newLocation.name}
                onChange={(e) => editingLocation 
                  ? setEditingLocation({ ...editingLocation, name: e.target.value })
                  : setNewLocation({ ...newLocation, name: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="location-address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                id="location-address"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={editingLocation ? editingLocation.address : newLocation.address}
                onChange={(e) => editingLocation
                  ? setEditingLocation({ ...editingLocation, address: e.target.value })
                  : setNewLocation({ ...newLocation, address: e.target.value })
                }
              />
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setEditingLocation(null)}
                className={`px-4 py-2 ${editingLocation ? 'text-gray-600 hover:text-gray-800' : 'invisible'}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingLocation ? <Save className="h-4 w-4 mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
                {editingLocation ? 'Update Location' : 'Add Location'}
              </button>
            </div>
          </form>
        </div>

        {/* Printers Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium mb-4 flex items-center">
            <Printer className="h-5 w-5 mr-2" /> Printers
          </h2>
          
          {/* Printers List */}
          <div className="mb-6">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent"></div>
                <p className="mt-2 text-gray-600">Loading printers...</p>
              </div>
            ) : printers.length === 0 ? (
              <p className="text-gray-500 italic">No printers added yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Printer ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printers.map((printer) => (
                      <tr key={printer.id} className="border-t border-gray-200">
                        <td className="px-4 py-2">{printer.name}</td>
                        <td className="px-4 py-2">{printer.printer_id}</td>
                        <td className="px-4 py-2">{printer.location?.name || '-'}</td>
                        <td className="px-4 py-2">
                          {printer.is_default ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Default
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingPrinter({
                                id: printer.id,
                                name: printer.name,
                                printer_id: printer.printer_id,
                                location_id: printer.location_id,
                                is_default: printer.is_default
                              })}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Edit Printer"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeletePrinter(printer.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Delete Printer"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Add/Edit Printer Form */}
          <form onSubmit={handlePrinterSubmit} className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-3">
              {editingPrinter ? 'Edit Printer' : 'Add New Printer'}
            </h3>
            
            <div className="mb-3">
              <label htmlFor="printer-name" className="block text-sm font-medium text-gray-700 mb-1">
                Printer Name *
              </label>
              <input
                id="printer-name"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={editingPrinter ? editingPrinter.name : newPrinter.name}
                onChange={(e) => editingPrinter
                  ? setEditingPrinter({ ...editingPrinter, name: e.target.value })
                  : setNewPrinter({ ...newPrinter, name: e.target.value })
                }
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="printer-id" className="block text-sm font-medium text-gray-700 mb-1">
                PrintNode Printer ID *
              </label>
              <input
                id="printer-id"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={editingPrinter ? editingPrinter.printer_id : newPrinter.printer_id}
                onChange={(e) => editingPrinter
                  ? setEditingPrinter({ ...editingPrinter, printer_id: e.target.value })
                  : setNewPrinter({ ...newPrinter, printer_id: e.target.value })
                }
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="location-select" className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <select
                id="location-select"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={editingPrinter ? editingPrinter.location_id : newPrinter.location_id}
                onChange={(e) => editingPrinter
                  ? setEditingPrinter({ ...editingPrinter, location_id: e.target.value })
                  : setNewPrinter({ ...newPrinter, location_id: e.target.value })
                }
                required
              >
                <option value="">Select Location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
              {locations.length === 0 && (
                <p className="mt-1 text-sm text-amber-600">
                  Please add at least one location first.
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  id="is-default"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={editingPrinter ? editingPrinter.is_default : newPrinter.is_default}
                  onChange={(e) => editingPrinter
                    ? setEditingPrinter({ ...editingPrinter, is_default: e.target.checked })
                    : setNewPrinter({ ...newPrinter, is_default: e.target.checked })
                  }
                />
                <label htmlFor="is-default" className="ml-2 block text-sm text-gray-900">
                  Set as default printer for this location
                </label>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setEditingPrinter(null)}
                className={`px-4 py-2 ${editingPrinter ? 'text-gray-600 hover:text-gray-800' : 'invisible'}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={locations.length === 0}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {editingPrinter ? <Save className="h-4 w-4 mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
                {editingPrinter ? 'Update Printer' : 'Add Printer'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm leading-5 font-medium text-blue-800">
              PrintNode Integration
            </h3>
            <div className="mt-2 text-sm leading-5 text-blue-700">
              <p>
                To use PrintNode for barcode printing, you need to:
              </p>
              <ol className="list-decimal list-inside mt-1 ml-2">
                <li>Create a PrintNode account</li>
                <li>Install PrintNode client on the computers with printers</li>
                <li>Get the Printer IDs from PrintNode dashboard</li>
                <li>Add those IDs here with corresponding locations</li>
              </ol>
              <p className="mt-2">
                For more information, visit the <a href="https://www.printnode.com/en" target="_blank" rel="noopener noreferrer" className="text-blue-800 underline">PrintNode website</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintersAdminPage;
