/**
 * Helper functions for product promotions
 */

/**
 * Check if promotion is currently active
 */
export function isPromotionActive(promotion) {
  if (!promotion || !promotion.active) return false;

  const now = new Date();
  const startDate = promotion.startDate ? new Date(promotion.startDate) : null;
  const endDate = promotion.endDate ? new Date(promotion.endDate) : null;

  // Check start date
  if (startDate && now < startDate) return false;

  // Check end date
  if (endDate && now > endDate) return false;

  return true;
}

/**
 * Calculate promotion price
 */
export function calculatePromotionPrice(basePrice, promotion) {
  if (!promotion || !promotion.active || !promotion.value) return basePrice;

  let promotionPrice = basePrice;

  if (promotion.type === 'percentage') {
    promotionPrice = basePrice - (basePrice * promotion.value / 100);
  } else {
    promotionPrice = basePrice - promotion.value;
  }

  return Math.max(0, promotionPrice);
}

/**
 * Get effective price (promotion price if active, otherwise base price)
 */
export function getEffectivePrice(product) {
  const basePrice = product.sellPrice || product.price || 0;

  if (!product.promotion) return basePrice;

  const isActive = isPromotionActive(product.promotion);
  if (!isActive) return basePrice;

  // Use pre-calculated promotion price if available
  if (product.promotion.promotionPrice !== null && product.promotion.promotionPrice !== undefined) {
    return product.promotion.promotionPrice;
  }

  // Calculate on the fly
  return calculatePromotionPrice(basePrice, product.promotion);
}

/**
 * Get discount percentage for display
 */
export function getDiscountPercentage(product) {
  const basePrice = product.sellPrice || product.price || 0;
  if (basePrice === 0) return 0;

  const effectivePrice = getEffectivePrice(product);
  const discount = basePrice - effectivePrice;
  
  return Math.round((discount / basePrice) * 100);
}

/**
 * Check if product has active promotion
 */
export function hasActivePromotion(product) {
  return product.promotion && isPromotionActive(product.promotion);
}
