export type FlatPaymentData = {
    id: string;
    paymentType: 'DB' | 'RECURRING' | 'INITIAL' | string;
    paymentBrand: string;
    amount: string;
    currency: string;
    merchantTransactionId: string;
    timestamp: string;
    status?: string;
    result?: {
        code?: string;
        description?: string;
    };
    resultDetails?: {
        AuthCode?: string;
        ReferenceNbr?: string;
        BatchNo?: string;
        TotalAmount?: string;
        Response?: string;
        ExtendedDescription?: string;
        clearingInstituteName?: string;
        AcquirerTimestamp?: string;
    };
    card?: {
        last4Digits?: string;
        holder?: string;
        expiryMonth?: string | number;
        expiryYear?: string | number;
    };
    customer?: {
        givenName?: string;
        middleName?: string;
        surname?: string;
        merchantCustomerId?: string;
        email?: string;
        ip?: string;
    };
    registrationId?: string;
    recurringType?: 'INITIAL' | 'REPEATED';
    customParameters?: Record<string, any>;
};
type SubscriptionPayload = {
    subscription?: any;
    paymentToken?: any;
    paymentResult?: any;
};
export declare function normalizeSubscriptionToPaymentData(payload: SubscriptionPayload): FlatPaymentData;
export {};
