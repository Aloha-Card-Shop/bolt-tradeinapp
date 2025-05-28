export interface Customer {
  first_name: string;
  last_name: string;
}

export interface TradeInItem {
  id?: string;
  card_id?: string;
  card_name: string;
  set_name?: string;
  quantity: number;
  price: number;
  condition: string;
  attributes: {
    isFirstEdition?: boolean;
    isHolo?: boolean;
    paymentType?: 'cash' | 'trade';
    cashValue?: number;
    tradeValue?: number;
    cardNumber?: string;
    setName?: string;
    adjustmentNotes?: string;
    adjustedBy?: string;
    adjustedAt?: string;
  };
  tcgplayer_url?: string;
  image_url?: string;
  shopify_product_id?: string;
  shopify_variant_id?: string;
  shopify_inventory_item_id?: string;
  shopify_sync_status?: string;
  shopify_synced_at?: string;
  rarity?: string;
  trade_in_id?: string;
}

export interface TradeIn {
  id: string;
  customer_id: string;
  trade_in_date: string;
  total_value: number;
  cash_value: number;
  trade_value: number;
  status: 'pending' | 'accepted' | 'rejected';
  customer_name?: string;
  customers?: Customer;
  notes?: string | null;
  payment_type?: 'cash' | 'trade' | 'mixed';
  staff_notes?: string | null;
  items?: TradeInItem[];
  submitter_email?: string | null; 
  handled_by?: string | null;
  handled_at?: string | null;
  is_updating?: boolean;
  // Print-related properties
  printed?: boolean;
  print_count?: number;
  last_printed_at?: string;
  printed_by?: string;
  printer_id?: string;
  // Shopify-related properties
  shopify_synced?: boolean;
  shopify_synced_at?: string;
  shopify_synced_by?: string;
}

export type StatusFilter = 'all' | 'pending' | 'accepted' | 'rejected';
