/**
 * Central constants for Order Types across the Haryana Info Hub API.
 * Future order types can be added here and referenced across routes and schemas.
 */
export const ORDER_TYPES = {
	GOVERNMENT_ORDER: 'government_order',
	PROFORMA_ORDER: 'proforma_order',
} as const;

export type OrderType = (typeof ORDER_TYPES)[keyof typeof ORDER_TYPES];
