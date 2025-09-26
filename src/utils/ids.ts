import { ulid } from 'ulid';

export const newMerchantTxnId = (prefix = 'ORD') => {
  // Usar timestamp + random para mayor unicidad
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
};
