
import React from 'react';
import { User } from 'lucide-react';
import { Customer } from '../../hooks/useCustomers';
import CustomerSelect from '../CustomerSelect';

interface ReviewCustomerSectionProps {
  customers: Customer[];
  isLoadingCustomers: boolean;
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  onCustomerCreate: (firstName: string, lastName: string, email?: string, phone?: string) => Promise<void>;
}

const ReviewCustomerSection: React.FC<ReviewCustomerSectionProps> = ({
  customers,
  isLoadingCustomers,
  selectedCustomer,
  onCustomerSelect,
  onCustomerCreate
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <User className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-800">Customer Information</h3>
      </div>

      <CustomerSelect
        customers={customers}
        isLoading={isLoadingCustomers}
        selectedCustomer={selectedCustomer}
        onSelect={onCustomerSelect}
        onCreateNew={onCustomerCreate}
      />
    </div>
  );
};

export default ReviewCustomerSection;
