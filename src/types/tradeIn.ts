
export interface Customer {
  first_name: string;
  last_name: string;
}

export interface TradeInItem {
  id?: string;
  card_id?: string;
  card_name: string;
  quantity: number;
  price: number;
  condition: string;
  attributes: {
    isFirstEdition?: boolean;
    isHolo?: boolean;
    paymentType?: 'cash' | 'trade';
    cashValue?: number;
    tradeValue?: number;
  };
  tcgplayer_url?: string | null;
  image_url?: string | null;
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
}

export type StatusFilter = 'all' | 'pending' | 'accepted' | 'rejected';
