import type { Database } from '../integrations/supabase/types';
import type { TradeInItem, TradeIn } from '../types/tradeIn';

type DatabaseRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

/**
 * Safely converts database null values to undefined for frontend types
 */
export function convertNullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

/**
 * Type-safe conversion from database TradeInItem to frontend TradeInItem
 */
export function convertDbTradeInItem(dbItem: DatabaseRow<'trade_in_items'> & { cards?: any }): TradeInItem {
  const attributes = dbItem.attributes as any || {};
  
  return {
    id: dbItem.id,
    card_id: dbItem.card_id,
    card_name: attributes.cardName || 'Unknown Card',
    set_name: attributes.setName,
    quantity: dbItem.quantity,
    price: dbItem.price,
    condition: dbItem.condition,
    attributes: {
      isFirstEdition: Boolean(attributes.isFirstEdition),
      isHolo: Boolean(attributes.isHolo),
      paymentType: attributes.paymentType as 'cash' | 'trade' | undefined,
      cashValue: Number(attributes.cashValue) || undefined,
      tradeValue: Number(attributes.tradeValue) || undefined,
      cardNumber: convertNullToUndefined(attributes.cardNumber),
      setName: convertNullToUndefined(attributes.setName),
      adjustmentNotes: convertNullToUndefined(attributes.adjustmentNotes),
      adjustedBy: convertNullToUndefined(attributes.adjustedBy),
      adjustedAt: convertNullToUndefined(attributes.adjustedAt),
      cashValueManuallySet: Boolean(attributes.cashValueManuallySet),
      tradeValueManuallySet: Boolean(attributes.tradeValueManuallySet),
      marketPriceManuallySet: Boolean(attributes.marketPriceManuallySet),
      isCertified: Boolean(attributes.isCertified),
      certNumber: convertNullToUndefined(attributes.certNumber),
      grade: attributes.grade,
      certificationCompany: convertNullToUndefined(attributes.certificationCompany),
    },
    tcgplayer_url: dbItem.cards?.tcgplayer_url,
    image_url: dbItem.cards?.image_url,
    rarity: dbItem.cards?.rarity,
    trade_in_id: dbItem.trade_in_id,
  };
}

/**
 * Type-safe conversion from database TradeIn to frontend TradeIn
 */
export function convertDbTradeIn(dbTradeIn: any): TradeIn {
  return {
    id: dbTradeIn.id,
    customer_id: dbTradeIn.customer_id,
    trade_in_date: dbTradeIn.trade_in_date || new Date().toISOString(),
    total_value: Number(dbTradeIn.total_value) || 0,
    cash_value: Number(dbTradeIn.cash_value) || 0,
    trade_value: Number(dbTradeIn.trade_value) || 0,
    status: dbTradeIn.status as 'pending' | 'accepted' | 'rejected',
    customer_name: dbTradeIn.customer_name,
    customers: dbTradeIn.customers ? {
      first_name: dbTradeIn.customers.first_name || '',
      last_name: dbTradeIn.customers.last_name || ''
    } : undefined,
    notes: convertNullToUndefined(dbTradeIn.notes),
    payment_type: dbTradeIn.payment_type as 'cash' | 'trade' | 'mixed' | undefined,
    staff_notes: convertNullToUndefined(dbTradeIn.staff_notes),
    submitter_email: convertNullToUndefined(dbTradeIn.submitter_email),
    handled_by: convertNullToUndefined(dbTradeIn.handled_by),
    handled_at: convertNullToUndefined(dbTradeIn.handled_at),
    printed: Boolean(dbTradeIn.printed),
    print_count: Number(dbTradeIn.print_count) || 0,
    last_printed_at: convertNullToUndefined(dbTradeIn.last_printed_at),
    printed_by: convertNullToUndefined(dbTradeIn.printed_by),
    printer_id: convertNullToUndefined(dbTradeIn.printer_id),
    shopify_synced: Boolean(dbTradeIn.shopify_synced),
    shopify_synced_at: convertNullToUndefined(dbTradeIn.shopify_synced_at),
    shopify_synced_by: convertNullToUndefined(dbTradeIn.shopify_synced_by),
  };
}

/**
 * Safely extracts enum values with fallback
 */
export function safeEnumCast<T extends string>(value: unknown, validValues: readonly T[], fallback: T): T {
  if (typeof value === 'string' && validValues.includes(value as T)) {
    return value as T;
  }
  return fallback;
}

/**
 * Type guard for checking if a value is not null or undefined
 */
export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}