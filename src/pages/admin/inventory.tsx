import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ShoppingCart, Printer, RefreshCw, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';

interface InventoryItem {
  id: string;
  trade_in_price: number;
  current_selling_price: number | null;
  market_price: number | null;
  last_price_check: string;
  processed_by: string | null;
  processed_at: string;
  shopify_synced: boolean;
  shopify_synced_at: string | null;
  printed: boolean;
  print_count: number;
  status: string;
  notes: string | null;
  cards: {
    id: string;
    name: string;
    set_name: string | null;
    image_url: string | null;
    card_number: string | null;
  };
  trade_in_items: {
    condition: string;
    quantity: number;
  };
  processed_by_profile: {
    email: string;
  } | null;
}

const CardInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [syncFilter, setSyncFilter] = useState('all');
  

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('card_inventory')
        .select(`
          *,
          cards (
            id,
            name,
            set_name,
            image_url,
            card_number
          ),
          trade_in_items (
            condition,
            quantity
          ),
          processed_by_profile:profiles!processed_by (
            email
          )
        `)
        .order('processed_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
      } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error("Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleShopifySync = async (_itemId: string) => {
    try {
      // This would integrate with existing Shopify sync functionality
      toast.success("Shopify sync initiated (integration needed)");
    } catch (error) {
      console.error('Error syncing to Shopify:', error);
      toast.error("Failed to sync to Shopify");
    }
  };

  const handlePrint = async (_itemId: string) => {
    try {
      // This would integrate with existing print functionality
      toast.success("Print initiated (integration needed)");
    } catch (error) {
      console.error('Error printing:', error);
      toast.error("Failed to print barcode");
    }
  };

  const handlePriceRefresh = async (_itemId: string) => {
    try {
      // This would integrate with existing price scraping functionality
      toast.success("Price refresh initiated (integration needed)");
    } catch (error) {
      console.error('Error refreshing price:', error);
      toast.error("Failed to refresh price");
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.cards.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.cards.set_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.cards.card_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSync = syncFilter === 'all' || 
                       (syncFilter === 'synced' && item.shopify_synced) ||
                       (syncFilter === 'not_synced' && !item.shopify_synced);
    
    return matchesSearch && matchesStatus && matchesSync;
  });

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      sold: 'bg-gray-100 text-gray-800',
      removed: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colorMap[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getSyncBadge = (synced: boolean) => {
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${synced ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
        {synced ? 'Synced' : 'Not Synced'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Search className="h-5 w-5" />
            Card Inventory
          </h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="removed">Removed</option>
            </select>
            <select 
              value={syncFilter} 
              onChange={(e) => setSyncFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Items</option>
              <option value="synced">Synced</option>
              <option value="not_synced">Not Synced</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trade-In Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processed By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shopify</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Printed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {item.cards.image_url && (
                          <img 
                            src={item.cards.image_url} 
                            alt={item.cards.name}
                            className="w-10 h-14 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{item.cards.name}</div>
                          <div className="text-sm text-gray-500">
                            {item.cards.set_name} {item.cards.card_number && `#${item.cards.card_number}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {item.trade_in_items.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.trade_in_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.current_selling_price ? formatCurrency(item.current_selling_price) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.market_price ? formatCurrency(item.market_price) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.processed_by_profile?.email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getSyncBadge(item.shopify_synced)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${item.printed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.printed ? `Printed (${item.print_count})` : 'Not Printed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShopifySync(item.id)}
                          disabled={item.shopify_synced}
                          className="p-2 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                          title="Sync to Shopify"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(item.id)}
                          className="p-2 text-green-600 hover:text-green-800"
                          title="Print Barcode"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePriceRefresh(item.id)}
                          className="p-2 text-purple-600 hover:text-purple-800"
                          title="Refresh Price"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No inventory items found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardInventory;