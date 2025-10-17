export declare enum SubscriptionPlanDto {
    MONTHLY = "MONTHLY",
    YEARLY = "YEARLY",
    GYM_MONTHLY = "GYM_MONTHLY",
    APP_MONTHLY = "APP_MONTHLY",
    TEST_MONTHLY = "TEST_MONTHLY"
}
export declare class CustomerDto {
    merchantCustomerId: string;
    email: string;
    givenName: string;
    middleName?: string;
    surname: string;
    identificationDocType: string;
    identificationDocId: string;
    phone: string;
    street1: string;
    city: string;
    state: string;
    country: string;
    postcode: string;
}
export declare class PaymentDto {
    merchantTransactionId: string;
    paymentBrand: string;
    amount: number;
    currency: string;
    planType: SubscriptionPlanDto;
    paymentType: string;
}
export declare class CreateSubscriptionDto {
    customer: CustomerDto;
    payment: PaymentDto;
    returnUrl: string;
    customerIp?: string;
}
