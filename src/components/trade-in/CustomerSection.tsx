
import React, { useState } from 'react';
import { User, UserPlus, Edit } from 'lucide-react';
import { Customer } from '../../hooks/useCustomers';
import CustomerSelect from '../CustomerSelect';

interface CustomerSectionProps {
  selectedCustomer: Customer | null;
  customers: Customer[];
  isLoadingCustomers: boolean;
  onCustomerSelect: (customer: Customer | null) => void;
  onCustomerCreate: (firstName: string, lastName: string, email?: string, phone?: string) => Promise<void>;
}

const CustomerSection: React.FC<CustomerSectionProps> = ({
  selectedCustomer,
  customers,
  isLoadingCustomers,
  onCustomerSelect,
  onCustomerCreate
}) => {
  const [isSelectingCustomer, setIsSelectingCustomer] = useState(false);

  const handleCustomerSelect = (customer: Customer | null) => {
    onCustomerSelect(customer);
    setIsSelectingCustomer(false);
  };

  const handleCustomerCreate = async (firstName: string, lastName: string, email?: string, phone?: string) => {
    await onCustomerCreate(firstName, lastName, email, phone);
    setIsSelectingCustomer(false);
  };

  if (isSelectingCustomer) {
    return (
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-800">Select Customer</h3>
          <button
            onClick={() => setIsSelectingCustomer(false)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
        <CustomerSelect
          customers={customers}
          isLoading={isLoadingCustomers}
          selectedCustomer={selectedCustomer}
          onSelect={handleCustomerSelect}
          onCreateNew={handleCustomerCreate}
        />
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-800">Customer</h3>
            {selectedCustomer ? (
              <div className="text-sm text-gray-600">
                <p className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                {selectedCustomer.email && <p>{selectedCustomer.email}</p>}
                {selectedCustomer.phone && <p>{selectedCustomer.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No customer selected</p>
            )}
          </div>
        </div>
        
        <button
          onClick={() => setIsSelectingCustomer(true)}
          className="flex items-center px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          {selectedCustomer ? (
            <>
              <Edit className="h-4 w-4 mr-1" />
              Change
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-1" />
              Select Customer
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CustomerSection;
