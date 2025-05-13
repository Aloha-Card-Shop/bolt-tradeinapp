
import { CardDetails } from '../../types/card';
import { SetOption } from '../../hooks/useSetOptions';

export interface QueryResult {
  query: any;
  foundSetIds: Set<number>;
}

export interface FormattedSearchResults {
  cards: CardDetails[];
  setIds: Set<number>;
}

export const RESULTS_PER_PAGE = 48;
