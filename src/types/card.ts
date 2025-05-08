export type GameType = 'pokemon' | 'japanese-pokemon' | 'magic';

export interface CardDetails {
  name: string;
  set?: string;
  number?: string;
  url?: string;
  game: GameType;
  categoryId?: number;
  imageUrl?: string | null;
  productId?: string | null;
  id?: string;
}

export interface PriceData {
  marketPrice: string | null;
  lowPrice: string | null;
  midPrice: string | null;
  highPrice: string | null;
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface SavedCard extends CardDetails {
  id: string;
  lastChecked: string;
  lastPrice: string | null;
}

export interface GameOption {
  value: GameType;
  label: string;
  categoryId: number;
}

export const GAME_OPTIONS: GameOption[] = [
  { value: 'pokemon', label: 'Pokemon', categoryId: 3 },
  { value: 'japanese-pokemon', label: 'Japanese Pokemon', categoryId: 85 },
  { value: 'magic', label: 'Magic: The Gathering', categoryId: 1 }
];