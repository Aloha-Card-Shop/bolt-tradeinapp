
import React from 'react';
import { PrintLog } from '../../types/barcode';
import { Check, X, AlertTriangle } from 'lucide-react';

interface PrintLogsTableProps {
  logs: PrintLog[];
  isLoading: boolean;
}

const PrintLogsTable: React.FC<PrintLogsTableProps> = ({ logs, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No print logs found.</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trade-In</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Print Job ID</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Error</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {logs.map((log) => {
            const tradeIn = log.trade_in;
            const customerName = tradeIn?.customers ? 
              `${tradeIn.customers.first_name} ${tradeIn.customers.last_name}` : 
              'Unknown';
            
            return (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.printed_at ? new Date(log.printed_at).toLocaleString() : '--'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="font-medium text-gray-900">{tradeIn?.id || log.trade_in_id}</div>
                  <div className="text-gray-500">{customerName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center">
                    {getStatusIcon(log.status)}
                    <span className="ml-2">{log.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                  {log.print_job_id || '--'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500 hidden lg:table-cell">
                  {log.error_message || '--'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PrintLogsTable;
