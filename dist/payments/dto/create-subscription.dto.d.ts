export declare enum SubscriptionPlanType {
    GYM_MONTHLY = "GYM_MONTHLY",
    APP_MONTHLY = "APP_MONTHLY",
    TEST_MONTHLY = "TEST_MONTHLY"
}
export declare class CreateSubscriptionDto {
    merchantTransactionId: string;
    planType: SubscriptionPlanType;
    givenName: string;
    middleName?: string;
    surname: string;
    email: string;
    merchantCustomerId: string;
    identificationDocType: string;
    identificationDocId: string;
    phone: string;
    street1: string;
    city: string;
    state: string;
    country: string;
    postcode: string;
    base0: string;
    baseImp: string;
    iva: string;
    currency?: string;
    returnUrl: string;
    customerIp?: string;
}
