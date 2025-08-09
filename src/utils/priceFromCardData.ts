import { CardDetails, CardVariant } from '../types/card';

// Map app condition values to variant condition labels
export const mapAppConditionToVariant = (condition: string): string => {
  switch (condition) {
    case 'near_mint':
      return 'Near Mint';
    case 'lightly_played':
      return 'Lightly Played';
    case 'moderately_played':
      return 'Moderately Played';
    case 'heavily_played':
      return 'Heavily Played';
    case 'damaged':
      return 'Damaged';
    default:
      // Pass-through if already formatted
      return condition;
  }
};

export const selectVariantPriceFromCardData = (
  card: CardDetails | undefined,
  appCondition: string | undefined,
  opts?: { isHolo?: boolean; isReverseHolo?: boolean }
): { price: number | null; matchedVariantId?: string } => {
  const variants: CardVariant[] | undefined = card?.variants;
  if (!variants || variants.length === 0 || !appCondition) {
    return { price: null };
  }

  const desiredCondition = mapAppConditionToVariant(appCondition);
  const desiredPrinting = (opts?.isHolo || opts?.isReverseHolo) ? 'Foil' : 'Normal';

  // Try exact match: condition + printing
  const exact = variants.find((v: CardVariant) =>
    v && v.condition === desiredCondition && v.printing === desiredPrinting && typeof v.price === 'number'
  );
  if (exact && typeof exact.price === 'number' && exact.price > 0) {
    return { price: exact.price, matchedVariantId: exact.id };
  }

  // Fallback: any printing with same condition
  const sameCond = variants.find((v: CardVariant) =>
    v && v.condition === desiredCondition && typeof v.price === 'number'
  );
  if (sameCond && sameCond.price > 0) {
    return { price: sameCond.price, matchedVariantId: sameCond.id };
  }

  // As a last resort: pick the highest priced variant for the desired printing (often NM if available)
  const printingGroup = variants.filter((v: CardVariant) => v?.printing === desiredPrinting && typeof v.price === 'number');
  if (printingGroup.length > 0) {
    const best = printingGroup.reduce((a: CardVariant, b: CardVariant) => (a.price >= b.price ? a : b));
    if (best && best.price > 0) return { price: best.price, matchedVariantId: best.id };
  }

  return { price: null };
};
