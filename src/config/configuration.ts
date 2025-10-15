export default () => ({
  oppwa: {
    url: process.env.OPPWA_URL,
    entityId: process.env.OPPWA_ENTITY_ID, // Para pagos únicos
    entityRecurringId: process.env.OPPWA_ENTITY_RECURRING_ID, // Para pagos recurrentes
    bearer: process.env.OPPWA_BEARER,
    testMode: process.env.TEST_MODE, // 'EXTERNAL' SOLO en test; en prod eliminar
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
