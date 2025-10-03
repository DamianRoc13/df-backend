"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSubscriptionToPaymentData = normalizeSubscriptionToPaymentData;
function normalizeSubscriptionToPaymentData(payload) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38;
    const pr = payload === null || payload === void 0 ? void 0 : payload.paymentResult;
    const lastPayment = ((_b = (_a = payload === null || payload === void 0 ? void 0 : payload.subscription) === null || _a === void 0 ? void 0 : _a.payments) === null || _b === void 0 ? void 0 : _b.length)
        ? payload.subscription.payments[payload.subscription.payments.length - 1]
        : null;
    const src = (pr !== null && pr !== void 0 ? pr : lastPayment === null || lastPayment === void 0 ? void 0 : lastPayment.gatewayResponse) ? {
        ...lastPayment.gatewayResponse,
        status: lastPayment.status,
        merchantTransactionId: lastPayment.merchantTransactionId
    } : pr;
    if (!src) {
        const sub = (_c = payload.subscription) !== null && _c !== void 0 ? _c : {};
        return {
            id: (_d = sub.id) !== null && _d !== void 0 ? _d : 'N/A',
            paymentType: 'RECURRING',
            paymentBrand: (_f = (_e = payload.paymentToken) === null || _e === void 0 ? void 0 : _e.brand) !== null && _f !== void 0 ? _f : 'VISA',
            amount: sub.amount ? String(sub.amount) : '0.00',
            currency: (_g = sub.currency) !== null && _g !== void 0 ? _g : 'USD',
            merchantTransactionId: 'N/A',
            timestamp: new Date().toISOString(),
            status: (_h = sub.status) !== null && _h !== void 0 ? _h : 'PENDING',
            result: { code: undefined, description: 'Sin datos de pago en payload' },
            card: {
                last4Digits: (_j = payload.paymentToken) === null || _j === void 0 ? void 0 : _j.last4,
                expiryMonth: (_k = payload.paymentToken) === null || _k === void 0 ? void 0 : _k.expiryMonth,
                expiryYear: (_l = payload.paymentToken) === null || _l === void 0 ? void 0 : _l.expiryYear,
            },
            customer: {
                givenName: (_m = sub.customer) === null || _m === void 0 ? void 0 : _m.givenName,
                middleName: (_o = sub.customer) === null || _o === void 0 ? void 0 : _o.middleName,
                surname: (_p = sub.customer) === null || _p === void 0 ? void 0 : _p.surname,
                merchantCustomerId: (_q = sub.customer) === null || _q === void 0 ? void 0 : _q.merchantCustomerId,
                email: (_r = sub.customer) === null || _r === void 0 ? void 0 : _r.email,
            },
            registrationId: (_s = payload.paymentToken) === null || _s === void 0 ? void 0 : _s.token,
            recurringType: 'INITIAL',
            customParameters: {},
        };
    }
    const resultDetails = (_t = src.resultDetails) !== null && _t !== void 0 ? _t : {};
    const card = (_u = src.card) !== null && _u !== void 0 ? _u : {};
    const customer = (_v = src.customer) !== null && _v !== void 0 ? _v : {};
    return {
        id: (_y = (_w = src.id) !== null && _w !== void 0 ? _w : (_x = payload.subscription) === null || _x === void 0 ? void 0 : _x.id) !== null && _y !== void 0 ? _y : 'N/A',
        paymentType: ((_z = src.paymentType) !== null && _z !== void 0 ? _z : 'RECURRING'),
        paymentBrand: (_2 = (_0 = src.paymentBrand) !== null && _0 !== void 0 ? _0 : (_1 = payload.paymentToken) === null || _1 === void 0 ? void 0 : _1.brand) !== null && _2 !== void 0 ? _2 : 'VISA',
        amount: String((_5 = (_3 = src.amount) !== null && _3 !== void 0 ? _3 : (_4 = payload.subscription) === null || _4 === void 0 ? void 0 : _4.amount) !== null && _5 !== void 0 ? _5 : '0.00'),
        currency: (_8 = (_6 = src.currency) !== null && _6 !== void 0 ? _6 : (_7 = payload.subscription) === null || _7 === void 0 ? void 0 : _7.currency) !== null && _8 !== void 0 ? _8 : 'USD',
        merchantTransactionId: (_10 = (_9 = src.merchantTransactionId) !== null && _9 !== void 0 ? _9 : lastPayment === null || lastPayment === void 0 ? void 0 : lastPayment.merchantTransactionId) !== null && _10 !== void 0 ? _10 : 'N/A',
        timestamp: (_12 = (_11 = resultDetails.AcquirerTimestamp) !== null && _11 !== void 0 ? _11 : src.timestamp) !== null && _12 !== void 0 ? _12 : new Date().toISOString(),
        status: (_13 = src.status) !== null && _13 !== void 0 ? _13 : lastPayment === null || lastPayment === void 0 ? void 0 : lastPayment.status,
        result: src.result,
        resultDetails: {
            AuthCode: resultDetails.AuthCode,
            ReferenceNbr: resultDetails.ReferenceNbr,
            BatchNo: resultDetails.BatchNo,
            TotalAmount: resultDetails.TotalAmount,
            Response: resultDetails.Response,
            ExtendedDescription: resultDetails.ExtendedDescription,
            clearingInstituteName: resultDetails.clearingInstituteName,
            AcquirerTimestamp: resultDetails.AcquirerTimestamp,
        },
        card: {
            last4Digits: (_14 = card.last4Digits) !== null && _14 !== void 0 ? _14 : (_15 = payload.paymentToken) === null || _15 === void 0 ? void 0 : _15.last4,
            holder: card.holder,
            expiryMonth: (_16 = card.expiryMonth) !== null && _16 !== void 0 ? _16 : (_17 = payload.paymentToken) === null || _17 === void 0 ? void 0 : _17.expiryMonth,
            expiryYear: (_18 = card.expiryYear) !== null && _18 !== void 0 ? _18 : (_19 = payload.paymentToken) === null || _19 === void 0 ? void 0 : _19.expiryYear,
        },
        customer: {
            givenName: (_20 = customer.givenName) !== null && _20 !== void 0 ? _20 : (_22 = (_21 = payload.subscription) === null || _21 === void 0 ? void 0 : _21.customer) === null || _22 === void 0 ? void 0 : _22.givenName,
            middleName: (_23 = customer.middleName) !== null && _23 !== void 0 ? _23 : (_25 = (_24 = payload.subscription) === null || _24 === void 0 ? void 0 : _24.customer) === null || _25 === void 0 ? void 0 : _25.middleName,
            surname: (_26 = customer.surname) !== null && _26 !== void 0 ? _26 : (_28 = (_27 = payload.subscription) === null || _27 === void 0 ? void 0 : _27.customer) === null || _28 === void 0 ? void 0 : _28.surname,
            merchantCustomerId: (_29 = customer.merchantCustomerId) !== null && _29 !== void 0 ? _29 : (_31 = (_30 = payload.subscription) === null || _30 === void 0 ? void 0 : _30.customer) === null || _31 === void 0 ? void 0 : _31.merchantCustomerId,
            email: (_32 = customer.email) !== null && _32 !== void 0 ? _32 : (_34 = (_33 = payload.subscription) === null || _33 === void 0 ? void 0 : _33.customer) === null || _34 === void 0 ? void 0 : _34.email,
            ip: customer.ip,
        },
        registrationId: (_35 = src.registrationId) !== null && _35 !== void 0 ? _35 : (_36 = payload.paymentToken) === null || _36 === void 0 ? void 0 : _36.token,
        recurringType: (_37 = src.recurringType) !== null && _37 !== void 0 ? _37 : ((lastPayment === null || lastPayment === void 0 ? void 0 : lastPayment.paymentType) === 'INITIAL' ? 'INITIAL' : 'REPEATED'),
        customParameters: (_38 = src.customParameters) !== null && _38 !== void 0 ? _38 : {},
    };
}
//# sourceMappingURL=normalize.js.map