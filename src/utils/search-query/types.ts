
import { CardNumberObject } from "../../types/card";

export const RESULTS_PER_PAGE = 40;

export interface SearchParams {
  name?: string;
  set?: string;
  cardNumber?: string | CardNumberObject | number | undefined;
  game?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
