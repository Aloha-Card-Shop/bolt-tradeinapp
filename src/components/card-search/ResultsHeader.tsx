
import React from 'react';
import { Search } from 'lucide-react';

interface ResultsHeaderProps {
  resultsCount: number;
  totalResults?: number;
}

const ResultsHeader: React.FC<ResultsHeaderProps> = ({ 
  resultsCount,
  totalResults
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Search className="h-5 w-5 text-indigo-600" />
        </div>
        <h2 className="ml-3 text-xl font-semibold text-gray-800">
          Search Results
          {resultsCount > 0 && (
            <span className="ml-2 text-sm text-gray-500">
              ({resultsCount}{totalResults && totalResults > resultsCount ? ` of ${totalResults}` : ''})
            </span>
          )}
        </h2>
      </div>
    </div>
  );
};

export default ResultsHeader;
