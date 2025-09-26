export declare enum SubscriptionPlanDto {
    GYM_MONTHLY = "GYM_MONTHLY",
    APP_MONTHLY = "APP_MONTHLY",
    TEST_MONTHLY = "TEST_MONTHLY"
}
export declare class CreateSubscriptionDto {
    email: string;
    givenName: string;
    middleName: string;
    surname: string;
    merchantCustomerId: string;
    planType: SubscriptionPlanDto;
    merchantTransactionId: string;
    customerIp: string;
    base0: string;
    baseImp: string;
    iva: string;
}
