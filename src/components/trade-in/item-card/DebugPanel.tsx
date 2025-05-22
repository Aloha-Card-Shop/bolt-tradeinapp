
import React from 'react';

interface DebugPanelProps {
  isVisible: boolean;
  debugInfo: {
    price: number;
    cashValue: number;
    tradeValue: number;
    game: string;
    paymentType: string;
    initialCalculation: string;
    error?: string;
  };
}

const DebugPanel: React.FC<DebugPanelProps> = ({ isVisible, debugInfo }) => {
  if (!isVisible) return null;

  return (
    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-500 border border-gray-200">
      <details>
        <summary className="cursor-pointer font-medium">Debug Info</summary>
        <div className="mt-1 space-y-1">
          <div><span className="font-medium">Price:</span> ${debugInfo.price?.toFixed(2)}</div>
          <div><span className="font-medium">Cash Value:</span> ${debugInfo.cashValue?.toFixed(2)}</div>
          <div><span className="font-medium">Trade Value:</span> ${debugInfo.tradeValue?.toFixed(2)}</div>
          <div><span className="font-medium">Game:</span> {debugInfo.game}</div>
          <div><span className="font-medium">Payment Type:</span> {debugInfo.paymentType}</div>
          <div><span className="font-medium">Initial Calculation:</span> {debugInfo.initialCalculation}</div>
          {debugInfo.error && <div className="text-red-500"><span className="font-medium">Error:</span> {debugInfo.error}</div>}
        </div>
      </details>
    </div>
  );
};

export default DebugPanel;
