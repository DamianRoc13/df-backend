export interface PaymentStatus {
    id?: string;
    result?: {
        code?: string;
        description?: string;
    };
    registrationId?: string;
    [k: string]: any;
}
