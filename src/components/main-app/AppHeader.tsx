
import React from 'react';
import { DatabaseIcon, Sparkles } from 'lucide-react';

export const AppHeader: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg relative overflow-hidden mt-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-4">
            <div className="p-2 md:p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <DatabaseIcon className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold tracking-tight">Aloha Card Shop</h1>
              <p className="text-sm md:text-base text-blue-100 mt-1">Trading Card Price Tracker</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-sm font-medium">Real-time Market Prices</span>
          </div>
        </div>
      </div>
    </header>
  );
};
