import React from 'react';
import { TrendingUp, TrendingDown, LineChart } from 'lucide-react';

interface PricePoint {
  date: string;
  price: number;
}

const generateMockPriceHistory = (): PricePoint[] => {
  const today = new Date();
  const data: PricePoint[] = [];
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const basePrice = 120;
    const randomFactor = Math.sin(i / 5) * 15;
    const noise = (Math.random() - 0.5) * 10;
    
    const price = basePrice + randomFactor + noise;
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: Math.max(80, Math.round(price * 100) / 100)
    });
  }
  
  return data;
};

const mockPriceHistory = generateMockPriceHistory();

interface PriceHistoryChartProps {
  cardName: string;
}

const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ cardName }) => {
  if (!cardName) return null;

  const prices = mockPriceHistory.map(point => point.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice;
  
  const chartHeight = 200;
  const chartWidth = 100 + '%';
  
  const startPrice = mockPriceHistory[0]?.price || 0;
  const endPrice = mockPriceHistory[mockPriceHistory.length - 1]?.price || 0;
  const priceChange = endPrice - startPrice;
  const percentChange = (priceChange / startPrice) * 100;
  const isPositive = priceChange >= 0;
  
  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <LineChart className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Price History</h2>
          <p className="text-sm text-gray-600 mt-1">30-day price trend</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm text-gray-600">Price Change (30d)</div>
          <div className={`flex items-center mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <TrendingUp className="h-5 w-5 mr-1" />
            ) : (
              <TrendingDown className="h-5 w-5 mr-1" />
            )}
            <span className="text-lg font-semibold">
              {isPositive ? '+' : ''}{priceChange.toFixed(2)}
            </span>
            <span className="ml-2">
              ({isPositive ? '+' : ''}{percentChange.toFixed(1)}%)
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-600">Current Price</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">
            ${endPrice.toFixed(2)}
          </div>
        </div>
      </div>
      
      <div className="relative" style={{ height: `${chartHeight}px` }}>
        <div className="absolute inset-0">
          <div className="h-full w-full grid grid-rows-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="border-t border-gray-100"></div>
            ))}
          </div>
        </div>
        
        <svg width={chartWidth} height={chartHeight} className="relative z-10">
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity="0.2" />
              <stop offset="100%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity="0" />
            </linearGradient>
          </defs>
          
          <polyline
            points={mockPriceHistory.map((point, index) => {
              const x = (index / (mockPriceHistory.length - 1)) * 100 + '%';
              const normalizedPrice = 1 - ((point.price - minPrice) / (range || 1));
              const y = normalizedPrice * chartHeight;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke={isPositive ? "#22c55e" : "#ef4444"}
            strokeWidth="2"
            className="transition-all duration-300"
          />
          
          <polygon
            points={`
              0,${chartHeight}
              ${mockPriceHistory.map((point, index) => {
                const x = (index / (mockPriceHistory.length - 1)) * 100 + '%';
                const normalizedPrice = 1 - ((point.price - minPrice) / (range || 1));
                const y = normalizedPrice * chartHeight;
                return `${x},${y}`;
              }).join(' ')}
              100%,${chartHeight}
            `}
            fill="url(#chartGradient)"
            className="transition-all duration-300"
          />
        </svg>
      </div>
      
      <div className="mt-4 grid grid-cols-3 text-sm">
        <div className="text-left text-gray-600">
          {mockPriceHistory[0]?.date}
        </div>
        <div className="text-center text-gray-600">
          {mockPriceHistory[Math.floor(mockPriceHistory.length / 2)]?.date}
        </div>
        <div className="text-right text-gray-600">
          {mockPriceHistory[mockPriceHistory.length - 1]?.date}
        </div>
      </div>
      
      <div className="mt-2 flex justify-between text-sm text-gray-500">
        <span>${minPrice.toFixed(2)}</span>
        <span>${maxPrice.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default PriceHistoryChart;