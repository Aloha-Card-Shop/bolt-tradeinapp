
// Search parameters types
export interface SearchParams {
  name: string;
  set: string;
  cardNumber?: string | number | null;
  game?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
}

// Define constants for pagination to be shared across the application
export const RESULTS_PER_PAGE = 40;
