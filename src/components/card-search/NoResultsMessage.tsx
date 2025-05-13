
import React from 'react';

interface NoResultsMessageProps {
  isSearchPerformed: boolean;
}

const NoResultsMessage: React.FC<NoResultsMessageProps> = ({ isSearchPerformed }) => {
  if (!isSearchPerformed) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Start typing to search for cards</p>
      </div>
    );
  }
  
  return (
    <div className="p-8 text-center">
      <p className="text-gray-500">No results found. Try different search criteria.</p>
    </div>
  );
};

export default NoResultsMessage;
