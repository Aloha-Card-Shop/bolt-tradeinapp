
import { TradeIn } from './tradeIn';

export interface BarcodeTemplate {
  id: string;
  name: string;
  description?: string;
  zpl_template: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  is_default?: boolean;
}

export interface BarcodeSetting {
  id: string;
  setting_name: string;
  setting_value: {
    barcodeType: string;
    width: number;
    height: number;
    fontSize: number;
    includeCustomerName: boolean;
    includeDate: boolean;
    includeValue: boolean;
    labelWidth: string;
    labelHeight: string;
    [key: string]: any;
  };
  description?: string;
  updated_by?: string;
  updated_at?: string;
}

export interface PrintLog {
  id: string;
  trade_in_id: string;
  printer_id: string;
  template_id?: string;
  printed_by: string;
  printed_at?: string;
  status: string;
  error_message?: string;
  print_job_id?: string;
  trade_in?: TradeIn;
}
