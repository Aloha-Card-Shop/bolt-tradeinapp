
// Search parameters types for the unified card search
export interface SearchParams {
  name: string;
  set: string;
  cardNumber?: string | number | null | { displayName?: string; value?: string };
  game?: string;
  categoryId?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
}

// Define constants for pagination to be shared across the application
export const RESULTS_PER_PAGE = 40;

// Search result type
export interface SearchQueryResult {
  data: any[];
  error: any;
  count: number | null;
  filter: string;
  sort: {
    column: string;
    ascending: boolean;
  };
}
