
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
  created_at: string;
  location?: Location;
}
