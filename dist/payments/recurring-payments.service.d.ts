import { PaymentsService } from '../payments/payments.service';
export declare class RecurringPaymentsService {
    private paymentsService;
    private readonly logger;
    constructor(paymentsService: PaymentsService);
    processDuePayments(): Promise<void>;
    retryFailedPayments(): Promise<void>;
    private getLastPaymentAttempt;
}
