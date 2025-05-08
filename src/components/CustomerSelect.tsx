import React, { useState } from 'react';
import { User, Plus, Search, Loader2 } from 'lucide-react';
import { Customer } from '../hooks/useCustomers';

interface CustomerSelectProps {
  customers: Customer[];
  isLoading: boolean;
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer | null) => void;
  onCreateNew: (firstName: string, lastName: string, email?: string, phone?: string) => Promise<void>;
}

const CustomerSelect: React.FC<CustomerSelectProps> = ({
  customers,
  isLoading,
  selectedCustomer,
  onSelect,
  onCreateNew
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.firstName.toLowerCase().includes(searchLower) ||
      customer.lastName.toLowerCase().includes(searchLower) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower))
    );
  });

  const handleCreateNew = async () => {
    try {
      await onCreateNew(
        newCustomer.firstName,
        newCustomer.lastName,
        newCustomer.email || undefined,
        newCustomer.phone || undefined
      );
      setIsCreatingNew(false);
      setNewCustomer({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Failed to create customer. Please try again.');
    }
  };

  if (isCreatingNew) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">New Customer</h3>
          </div>
          <button
            onClick={() => setIsCreatingNew(false)}
            className="text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={newCustomer.firstName}
                onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={newCustomer.lastName}
                onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleCreateNew}
            disabled={!newCustomer.firstName || !newCustomer.lastName}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Create Customer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!selectedCustomer && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-800">Select Customer</h3>
            </div>
            <button
              onClick={() => setIsCreatingNew(true)}
              className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Customer
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
          <p className="mt-2 text-gray-600">Loading customers...</p>
        </div>
      ) : selectedCustomer ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">
                {selectedCustomer.firstName} {selectedCustomer.lastName}
              </h4>
              {selectedCustomer.email && (
                <p className="text-sm text-gray-600 mt-1">{selectedCustomer.email}</p>
              )}
              {selectedCustomer.phone && (
                <p className="text-sm text-gray-600 mt-1">{selectedCustomer.phone}</p>
              )}
            </div>
            <button
              onClick={() => onSelect(null)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Change
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCustomers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => onSelect(customer)}
              className="w-full p-4 text-left bg-white border border-gray-200 rounded-xl hover:border-blue-200 hover:shadow-md transition duration-200"
            >
              <h4 className="font-medium text-gray-900">
                {customer.firstName} {customer.lastName}
              </h4>
              {customer.email && (
                <p className="text-sm text-gray-600 mt-1">{customer.email}</p>
              )}
            </button>
          ))}
          {filteredCustomers.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              No customers found
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSelect;