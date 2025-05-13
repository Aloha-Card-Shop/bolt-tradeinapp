
import { CardDetails, GameType, CardNumberObject } from '../../types/card';

export interface QueryResult {
  query: any;
  foundSetIds: Set<number>;
}

export interface FormattedSearchResults {
  cards: CardDetails[];
  setIds: Set<number>;
}

export interface SearchParams {
  name?: string;
  set?: string;
  cardNumber?: string | CardNumberObject | undefined;
  game?: GameType;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const RESULTS_PER_PAGE = 48;
