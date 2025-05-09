
export interface Customer {
  first_name: string;
  last_name: string;
}

export interface TradeInItem {
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
}

export type StatusFilter = 'all' | 'pending' | 'accepted' | 'rejected';
