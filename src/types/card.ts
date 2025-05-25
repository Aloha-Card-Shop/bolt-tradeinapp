export type GameType = 'pokemon' | 'magic' | 'yugioh' | 'sports' | 'other' | 'japanese-pokemon';

export type CardNumberObject = {
  raw: string;
  formatted: string;
  prefix?: string;
  number?: number;
  suffix?: string;
  displayName?: string; // Added for compatibility with existing code
  value?: string; // Added for compatibility with existing code
};

export interface CardCertification {
  certNumber: string;
  grade: string;
  certificationDate?: string | null;
  certifier?: string;
}

export interface PriceSource {
  name: string;
  url: string;
  salesCount?: number;
  foundSales?: boolean;
  soldItems?: Array<{
    title: string;
    price: number;
    url: string;
    endDate?: string;
  }>;
  priceRange?: {
    min: number;
    max: number;
  };
  outliersRemoved?: number;
  calculationMethod?: string;
  query?: string;
}

export interface CardDetails {
  id?: string;
  name: string;
  set?: string;
  setId?: string;
  number?: string | CardNumberObject;
  game: GameType;
  categoryId?: number;
  rarity?: string;
  releaseYear?: string;
  imageUrl?: string | null;
  productId?: string | null;
  savedAt?: Date;
  lastPrice?: number;
  certification?: CardCertification;
  isCertified?: boolean;
  priceSource?: PriceSource;
}

export interface PriceData {
  marketPrice?: string;
  lowPrice?: string;
  midPrice?: string;
  highPrice?: string;
  lastUpdated?: string;
  isLoading?: boolean;
  error?: string;
  directUrl?: string;
  manualSearchSuggested?: boolean; // Add this property to fix the TypeScript errors
}

export interface SavedCard extends CardDetails {
  savedAt: Date;
  lastPrice?: number;
}

export const GAME_OPTIONS = [
  { label: 'Pokémon', value: 'pokemon', categoryId: 2 },
  { label: 'Magic: The Gathering', value: 'magic', categoryId: 1 },
  { label: 'Yu-Gi-Oh!', value: 'yugioh', categoryId: 3 },
  { label: 'Sports Cards', value: 'sports', categoryId: 4 },
  { label: 'Other Cards', value: 'other', categoryId: 8 },
  { label: 'Japanese Pokémon', value: 'japanese-pokemon', categoryId: 9 }
];

export const CONDITION_OPTIONS = [
  { label: 'Near Mint', value: 'near_mint' },
  { label: 'Lightly Played', value: 'lightly_played' },
  { label: 'Moderately Played', value: 'moderately_played' },
  { label: 'Heavily Played', value: 'heavily_played' },
  { label: 'Damaged', value: 'damaged' }
];

export type CardCondition = 'near_mint' | 'lightly_played' | 'moderately_played' | 'heavily_played' | 'damaged';

export const CONDITION_ABBR: Record<CardCondition, string> = {
  near_mint: 'NM',
  lightly_played: 'LP',
  moderately_played: 'MP',
  heavily_played: 'HP',
  damaged: 'DMG'
};
