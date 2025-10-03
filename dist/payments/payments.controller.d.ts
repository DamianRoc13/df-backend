import { Response } from 'express';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
export declare class PaymentsController {
    private svc;
    constructor(svc: PaymentsService);
    create(dto: CreateCheckoutDto, req: any): Promise<any>;
    verifyRecurring(body: {
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
    status(resourcePath: string): Promise<any>;
    createSubscriptionCheckout(dto: CreateSubscriptionDto, req: any): Promise<any>;
    completeSubscription(body: {
        resourcePath: string;
        customerId: string;
        planType: string;
    }): Promise<{
        subscription: any;
        paymentToken: any;
        paymentResult: any;
        customerId: any;
    }>;
    chargeSubscription(subscriptionId: string): Promise<{
        payment: any;
        paymentResult: any;
        success: boolean;
    }>;
    getDueSubscriptions(): Promise<any>;
    pauseSubscription(subscriptionId: string): Promise<any>;
    cancelSubscription(subscriptionId: string): Promise<any>;
    resumeSubscription(subscriptionId: string): Promise<any>;
    paymentCallback(type: string, checkoutId: string, resourcePath: string, customerId?: string, planType?: string): Promise<{
        redirectUrl: string;
    }>;
    jsonResponse(response: Response, type: string, checkoutId: string, resourcePath: string, customerId?: string, planType?: string): Promise<void>;
}
