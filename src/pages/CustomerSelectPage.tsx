
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { Customer, useCustomers } from '../hooks/useCustomers';
import CustomerSelect from '../components/CustomerSelect';
import { insertTradeInAndItems } from '../services/insertTradeInAndItems';

interface TradeInItem {
  card: {
    id: string;
    name: string;
    game: string;
    productId?: string | null;
  };
  quantity: number;
  price: number;
  condition: string;
  isFirstEdition: boolean;
  isHolo: boolean;
  paymentType: 'cash' | 'trade';
}

const CustomerSelectPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const items = location.state?.items || [];
  const { customers, isLoading: isLoadingCustomers, createCustomer } = useCustomers();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalValue = items.reduce((sum: number, item: TradeInItem) => sum + (item.price * item.quantity), 0);

  const handleBack = () => {
    navigate('/trade-in/review', { state: { items } });
  };

  const handleCustomerSelect = async (customer: Customer | null) => {
    if (!customer) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const tradeInData = {
        customer_id: customer.id!,
        trade_in_date: new Date().toISOString(),
        total_value: totalValue,
        status: 'pending' as const
      };

      const itemsData = items.map((item: TradeInItem) => ({
        card_id: item.card.id!,
        quantity: item.quantity,
        price: item.price,
        condition: item.condition as 'near_mint' | 'lightly_played' | 'moderately_played' | 'heavily_played' | 'damaged',
        attributes: {
          isFirstEdition: item.isFirstEdition,
          isHolo: item.isHolo
        }
      }));

      await insertTradeInAndItems(tradeInData, itemsData);
      navigate('/app');
    } catch (error) {
      console.error('Error submitting trade-in:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit trade-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCustomer = async (firstName: string, lastName: string, email?: string, phone?: string): Promise<void> => {
    try {
      const newCustomer = await createCustomer(firstName, lastName, email, phone);
      handleCustomerSelect(newCustomer);
    } catch (error) {
      console.error('Error creating customer:', error);
      setError(error instanceof Error ? error.message : 'Failed to create customer');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800"
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Review
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Select Customer</h2>
              <p className="text-sm text-gray-600 mt-1">
                Total Value: ${totalValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <CustomerSelect
            customers={customers}
            isLoading={isLoadingCustomers}
            onSelect={handleCustomerSelect}
            onCreateNew={handleCreateCustomer}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerSelectPage;
