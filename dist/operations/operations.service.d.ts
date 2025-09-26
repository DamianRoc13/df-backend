import { HttpService } from '@nestjs/axios';
export declare class OperationsService {
    private http;
    constructor(http: HttpService);
    verifyBy(paymentId?: string, merchantTransactionId?: string): Promise<{
        source: string;
        data: any;
        note?: undefined;
    } | {
        source: string;
        data: any;
        note: string;
    }>;
    voidPayment(paymentId: string): Promise<any>;
}
