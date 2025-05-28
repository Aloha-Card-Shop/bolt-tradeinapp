
export interface Location {
  id: string;
  name: string;
  address?: string;
  created_at: string;
}

export interface Printer {
  id: string;
  name: string;
  printer_id: string;
  location_id: string;
  is_default: boolean;
  printer_type: 'ZPL' | 'RAW';
  created_at: string;
  location?: Location;
}

export interface PrinterModel {
  id: string;
  brand: string;
  model: string;
  printer_type: 'ZPL' | 'RAW';
  created_at: string;
}
