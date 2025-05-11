
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TradeInTable from '../dashboard/TradeInTable';
import ErrorMessage from '../common/ErrorMessage';
import { TradeIn } from '../../types/tradeIn';

interface MyTradeInsContentProps {
  tradeIns: TradeIn[];
  isLoading: boolean;
  errorMessage: string | null;
  expandedTradeIn: string | null;
  loadingItems: string | null;
  onToggleDetails: (id: string) => void;
}

const MyTradeInsContent: React.FC<MyTradeInsContentProps> = ({
  tradeIns,
  isLoading,
  errorMessage,
  expandedTradeIn,
  loadingItems,
  onToggleDetails
}) => {
  // Add state for tradeIns in this component since we need to provide setTradeIns prop
  const [localTradeIns, setLocalTradeIns] = useState<TradeIn[]>(tradeIns);

  // Update local state when props change
  React.useEffect(() => {
    setLocalTradeIns(tradeIns);
  }, [tradeIns]);

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Trade-ins</h1>
          <p className="text-gray-600 mt-1">View status and details of your trade-in requests</p>
        </div>

        {errorMessage && <ErrorMessage message={errorMessage} />}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <TradeInTable 
            tradeIns={localTradeIns}
            isLoading={isLoading}
            expandedTradeIn={expandedTradeIn}
            loadingItems={loadingItems}
            actionLoading={null}
            onToggleDetails={onToggleDetails}
            onApprove={() => {}}
            onDeny={() => {}}
            onDelete={() => {}}
            setTradeIns={setLocalTradeIns}
          />
        </div>
      </div>
    </div>
  );
};

export default MyTradeInsContent;
