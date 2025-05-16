
export interface TradeInItem {
  id: string;
  card_id: string;
  card_name: string;
  quantity: number;
  price: number;
  condition: string;
  attributes: any;
  tcgplayer_url?: string;
  image_url?: string;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Add the missing StatusFilter type
export type StatusFilter = 'all' | 'pending' | 'completed' | 'cancelled' | 'accepted' | 'rejected';

export interface TradeIn {
  id: string;
  customer_id: string;
  customer_name?: string;
  trade_in_date: string;
  total_value: number;
  cash_value: number;
  trade_value: number;
  notes?: string;
  staff_notes?: string;
  created_at: string;
  // Update status to include 'accepted' and 'rejected'
  status: 'pending' | 'completed' | 'cancelled' | 'accepted' | 'rejected';
  payment_type: 'cash' | 'trade' | 'mixed';
  handled_by?: string;
  handled_at?: string;
  shopify_synced?: boolean;
  shopify_synced_at?: string;
  shopify_synced_by?: string;
  printed?: boolean;
  print_count?: number;
  last_printed_at?: string;
  printed_by?: string;
  printer_id?: string;
  items?: TradeInItem[];
  customers?: Customer;
  // Add missing submitter_email field
  submitter_email?: string | null;
}
