"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newMerchantTxnId = void 0;
const newMerchantTxnId = (prefix = 'ORD') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
};
exports.newMerchantTxnId = newMerchantTxnId;
//# sourceMappingURL=ids.js.map