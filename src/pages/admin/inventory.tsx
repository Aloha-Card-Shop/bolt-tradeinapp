import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ShoppingCart, Printer, RefreshCw, Search, Package, DollarSign, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';
import EbaySalesModal from '../../components/admin/EbaySalesModal';

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
  import_source: string;
  cards: {
    id: string;
    name: string;
    set_name: string | null;
    image_url: string | null;
    card_number: string | null;
    attributes: any;
  };
  trade_in_items: {
    condition: string;
    quantity: number;
  } | null;
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
  const [sourceFilter, setSourceFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<InventoryItem | null>(null);
  

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
            card_number,
            attributes
          ),
          trade_in_items (
            condition,
            quantity
          ),
          processed_by_profile:profiles!processed_by (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
      } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error("Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleShopifySync = async (itemId: string) => {
    try {
      const { error } = await supabase.functions.invoke('shopify-sync-item', {
        body: { inventoryItemId: itemId }
      });

      if (error) throw error;

      toast.success("Item synced to Shopify successfully!");
      fetchInventory(); // Refresh the list
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

  const handleViewSales = (item: InventoryItem) => {
    setSelectedCard(item);
    setSalesModalOpen(true);
  };

  const isGradedCard = (item: InventoryItem) => {
    const tags = item.cards.attributes?.tags || '';
    return tags.toLowerCase().includes('psa') || tags.toLowerCase().includes('bgs');
  };

  const extractPsaGrade = (item: InventoryItem) => {
    const tags = item.cards.attributes?.tags || '';
    const psaMatch = tags.match(/PSA\s*(\d+)/i);
    return psaMatch ? psaMatch[1] : undefined;
  };

  // Extract unique Shopify tags from inventory
  const getUniqueShopifyTags = () => {
    const tagSet = new Set<string>();
    inventory.forEach(item => {
      if (item.cards.attributes?.tags) {
        const tags = item.cards.attributes.tags.split(',').map((tag: string) => tag.trim());
        tags.forEach((tag: string) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  };

  const uniqueTags = getUniqueShopifyTags();

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.cards.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.cards.set_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.cards.card_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSync = syncFilter === 'all' || 
                       (syncFilter === 'synced' && item.shopify_synced) ||
                       (syncFilter === 'not_synced' && !item.shopify_synced);
    const matchesSource = sourceFilter === 'all' || item.import_source === sourceFilter;
    
    const matchesTag = tagFilter === 'all' || 
                      (item.cards.attributes?.tags && 
                       item.cards.attributes.tags.toLowerCase().includes(tagFilter.toLowerCase()));
    
    return matchesSearch && matchesStatus && matchesSync && matchesSource && matchesTag;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: '📦' },
      sold: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: '✅' },
      removed: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: '❌' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
        <span>{config.icon}</span>
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </span>
    );
  };

  const getSyncBadge = (synced: boolean) => {
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
        synced 
          ? 'bg-cyan-100 text-cyan-700 border border-cyan-200' 
          : 'bg-amber-100 text-amber-700 border border-amber-200'
      }`}>
        <span>{synced ? '🔄' : '⏳'}</span>
        <span>{synced ? 'Synced' : 'Pending'}</span>
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
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Card Inventory</h1>
                <p className="text-sm text-gray-500">Track and manage cards from trade-ins and Shopify sync</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Total Items:</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                {filteredInventory.length}
              </span>
            </div>
          </div>
        </div>
        
        {/* Enhanced Filters Section */}
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by card name, set, or number..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-colors"
                >
                  <option value="all">All Status</option>
                  <option value="available">📦 Available</option>
                  <option value="sold">✅ Sold</option>
                  <option value="removed">❌ Removed</option>
                </select>
              </div>
              <div className="relative">
                <select 
                  value={syncFilter} 
                  onChange={(e) => setSyncFilter(e.target.value)}
                  className="appearance-none px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-colors"
                >
                  <option value="all">All Sync Status</option>
                  <option value="synced">🔄 Synced</option>
                  <option value="not_synced">⏳ Not Synced</option>
                </select>
              </div>
              <div className="relative">
                <select 
                  value={sourceFilter} 
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="appearance-none px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-colors"
                >
                  <option value="all">All Sources</option>
                  <option value="trade_in">🔄 Trade-In</option>
                  <option value="shopify">🛍️ Shopify</option>
                </select>
              </div>
              <div className="relative">
                <select 
                  value={tagFilter} 
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="appearance-none px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-colors"
                >
                  <option value="all">All Tags</option>
                  {uniqueTags.map(tag => (
                    <option key={tag} value={tag}>🏷️ {tag}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        
        {/* Enhanced Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Card Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Condition</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Trade-In
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Selling Price
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Market Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Processed By
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sync Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Print Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-200 animate-fade-in">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {item.cards.image_url ? (
                          <div className="relative group">
                            <img 
                              src={item.cards.image_url} 
                              alt={item.cards.name}
                              className="w-12 h-16 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all"></div>
                          </div>
                        ) : (
                          <div className="w-12 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 truncate">{item.cards.name}</div>
                          <div className="text-sm text-gray-500 truncate">
                            {item.cards.set_name} {item.cards.card_number && (
                              <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                #{item.cards.card_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {item.trade_in_items ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            {item.trade_in_items.condition.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            N/A
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          item.import_source === 'shopify' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {item.import_source === 'shopify' ? '🛍️ Shopify' : '🔄 Trade-In'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.trade_in_price)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {item.current_selling_price ? (
                        <span className="text-sm font-semibold text-green-600">{formatCurrency(item.current_selling_price)}</span>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.market_price ? (
                        <span className="text-sm text-gray-700">{formatCurrency(item.market_price)}</span>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Unknown</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {item.processed_by_profile?.email?.split('@')[0] || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(item.processed_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4">{getSyncBadge(item.shopify_synced)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        item.printed 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {item.printed ? `✓ Printed (${item.print_count})` : '⏳ Not Printed'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleShopifySync(item.id)}
                          disabled={item.shopify_synced}
                          className="p-2 rounded-lg transition-colors hover:bg-blue-50 text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          title="Sync to Shopify"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(item.id)}
                          className="p-2 rounded-lg transition-colors hover:bg-green-50 text-green-600 hover:text-green-700"
                          title="Print Barcode"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePriceRefresh(item.id)}
                          className="p-2 rounded-lg transition-colors hover:bg-purple-50 text-purple-600 hover:text-purple-700"
                          title="Refresh Price"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        {isGradedCard(item) && (
                          <button
                            onClick={() => handleViewSales(item)}
                            className="p-2 rounded-lg transition-colors hover:bg-orange-50 text-orange-600 hover:text-orange-700"
                            title="View eBay Sales"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        
        {/* Enhanced Empty State */}
        {filteredInventory.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No inventory items found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' || syncFilter !== 'all' 
                ? "Try adjusting your search criteria or filters."
                : "Start by approving some trade-ins to build your inventory."
              }
            </p>
            {(searchTerm || statusFilter !== 'all' || syncFilter !== 'all' || sourceFilter !== 'all' || tagFilter !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSyncFilter('all');
                  setSourceFilter('all');
                  setTagFilter('all');
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* eBay Sales Modal */}
      {selectedCard && (
        <EbaySalesModal
          isOpen={salesModalOpen}
          onClose={() => {
            setSalesModalOpen(false);
            setSelectedCard(null);
          }}
          cardName={selectedCard.cards.name}
          cardSet={selectedCard.cards.set_name}
          cardNumber={selectedCard.cards.card_number}
          psaGrade={extractPsaGrade(selectedCard)}
        />
      )}
    </div>
  );
};

export default CardInventory;