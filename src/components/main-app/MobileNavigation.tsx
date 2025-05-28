
import React from 'react';
import { DatabaseIcon, Menu, Sparkles } from 'lucide-react';

interface MobileNavigationProps {
  activeSection: 'search' | 'results' | 'tradein';
  setActiveSection: (section: 'search' | 'results' | 'tradein') => void;
  itemsCount: number;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeSection,
  setActiveSection,
  itemsCount
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30">
      <button 
        className={`flex-1 py-3 flex flex-col items-center ${activeSection === 'search' ? 'text-blue-600' : 'text-gray-500'}`}
        onClick={() => setActiveSection('search')}
      >
        <DatabaseIcon className="h-5 w-5 mb-1" />
        <span className="text-xs">Search</span>
      </button>
      <button 
        className={`flex-1 py-3 flex flex-col items-center ${activeSection === 'results' ? 'text-blue-600' : 'text-gray-500'}`}
        onClick={() => setActiveSection('results')}
      >
        <Menu className="h-5 w-5 mb-1" />
        <span className="text-xs">Results</span>
      </button>
      <button 
        className={`flex-1 py-3 flex flex-col items-center ${activeSection === 'tradein' ? 'text-blue-600' : 'text-gray-500'}`}
        onClick={() => setActiveSection('tradein')}
      >
        <Sparkles className="h-5 w-5 mb-1" />
        <span className="text-xs">Trade-In</span>
        {itemsCount > 0 && (
          <span className="absolute top-2 right-1/3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {itemsCount}
          </span>
        )}
      </button>
    </div>
  );
};
