import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto, SubscriptionPlanDto } from './dto/create-subscription.dto';
export declare class PaymentsService {
    private http;
    private prisma;
    constructor(http: HttpService, prisma: PrismaService);
    private bearer;
    private entity;
    private oppUrl;
    createCheckout(input: any): Promise<any>;
    verifyRecurring(input: {
        merchantTransactionId?: string;
        ndc?: string;
    }): Promise<{
        success: boolean;
        status: string;
        error: string;
        resultCode?: undefined;
        resultDescription?: undefined;
        payment?: undefined;
        subscription?: undefined;
        paymentToken?: undefined;
        gateway?: undefined;
    } | {
        success: boolean;
        status: string;
        resultCode: any;
        resultDescription: any;
        payment: any;
        subscription: any;
        paymentToken: any;
        error?: undefined;
        gateway?: undefined;
    } | {
        success: boolean;
        status: string;
        resultCode: any;
        resultDescription: any;
        payment: {
            gatewayResponse: any;
        };
        error?: undefined;
        subscription?: undefined;
        paymentToken?: undefined;
        gateway?: undefined;
    } | {
        success: boolean;
        status: string;
        gateway: any;
        error?: undefined;
        resultCode?: undefined;
        resultDescription?: undefined;
        payment?: undefined;
        subscription?: undefined;
        paymentToken?: undefined;
    }>;
    private getPaymentStatusSafe;
    getPaymentStatus(resourcePath: string, customerId?: string): Promise<any>;
    processPaymentCallback(resourcePath: string, data: any): Promise<any>;
    private determinePaymentStatus;
    private waitForPaymentCompletion;
    createSubscriptionCheckout(dto: CreateSubscriptionDto): Promise<any>;
    completeSubscriptionSetup(resourcePath: string, customerId: string, planType: SubscriptionPlanDto): Promise<{
        subscription: any;
        paymentToken: any;
        paymentResult: any;
        customerId: any;
    }>;
    processRecurringPayment(subscriptionId: string): Promise<{
        payment: any;
        paymentResult: any;
        success: boolean;
    }>;
    getDueSubscriptions(): Promise<any>;
    pauseSubscription(subscriptionId: string): Promise<any>;
    cancelSubscription(subscriptionId: string): Promise<any>;
    resumeSubscription(subscriptionId: string): Promise<any>;
}
