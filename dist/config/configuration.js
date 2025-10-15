"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    oppwa: {
        url: process.env.OPPWA_URL,
        entityId: process.env.OPPWA_ENTITY_ID,
        entityRecurringId: process.env.OPPWA_ENTITY_RECURRING_ID,
        bearer: process.env.OPPWA_BEARER,
        testMode: process.env.TEST_MODE,
    },
    merchant: {
        mid: process.env.MID,
        tid: process.env.TID,
        name: process.env.MERCHANT_NAME || 'TuComercio',
    },
    server: {
        port: parseInt(process.env.PORT || '3000', 10),
    },
});
//# sourceMappingURL=configuration.js.map