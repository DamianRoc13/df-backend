import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
export declare class PaymentsController {
    private svc;
    constructor(svc: PaymentsService);
    create(dto: CreateCheckoutDto, req: any): Promise<any>;
    status(resourcePath: string): Promise<any>;
    createSubscriptionCheckout(dto: CreateSubscriptionDto, req: any): Promise<any>;
    completeSubscription(body: {
        resourcePath: string;
        customerId: string;
        planType: string;
    }): Promise<{
        subscription: {
            payments: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                customerId: string;
                tokenId: string | null;
                status: import("@prisma/client").$Enums.PaymentStatus;
                amount: import("@prisma/client/runtime/library").Decimal;
                currency: string;
                subscriptionId: string | null;
                paymentType: import("@prisma/client").$Enums.PaymentType;
                merchantTransactionId: string;
                base0: import("@prisma/client/runtime/library").Decimal;
                baseImp: import("@prisma/client/runtime/library").Decimal;
                iva: import("@prisma/client/runtime/library").Decimal;
                gatewayResponse: import("@prisma/client/runtime/library").JsonValue;
                resultCode: string;
                resultDescription: string | null;
                resourcePath: string | null;
            }[];
            customer: {
                id: string;
                merchantCustomerId: string;
                email: string;
                givenName: string;
                middleName: string;
                surname: string;
                createdAt: Date;
                updatedAt: Date;
            };
            token: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                customerId: string;
                token: string;
                brand: string;
                last4: string;
                expiryMonth: number;
                expiryYear: number;
                isActive: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            tokenId: string;
            planType: import("@prisma/client").$Enums.SubscriptionPlan;
            status: import("@prisma/client").$Enums.SubscriptionStatus;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            nextBillingDate: Date;
            lastBillingDate: Date | null;
            failedAttempts: number;
            maxRetries: number;
        };
        paymentToken: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            token: string;
            brand: string;
            last4: string;
            expiryMonth: number;
            expiryYear: number;
            isActive: boolean;
        };
        paymentResult: any;
        customerId: string;
    }>;
    chargeSubscription(subscriptionId: string): Promise<{
        payment: {
            customer: {
                id: string;
                merchantCustomerId: string;
                email: string;
                givenName: string;
                middleName: string;
                surname: string;
                createdAt: Date;
                updatedAt: Date;
            };
            token: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                customerId: string;
                token: string;
                brand: string;
                last4: string;
                expiryMonth: number;
                expiryYear: number;
                isActive: boolean;
            };
            subscription: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                customerId: string;
                tokenId: string;
                planType: import("@prisma/client").$Enums.SubscriptionPlan;
                status: import("@prisma/client").$Enums.SubscriptionStatus;
                amount: import("@prisma/client/runtime/library").Decimal;
                currency: string;
                nextBillingDate: Date;
                lastBillingDate: Date | null;
                failedAttempts: number;
                maxRetries: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            tokenId: string | null;
            status: import("@prisma/client").$Enums.PaymentStatus;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            subscriptionId: string | null;
            paymentType: import("@prisma/client").$Enums.PaymentType;
            merchantTransactionId: string;
            base0: import("@prisma/client/runtime/library").Decimal;
            baseImp: import("@prisma/client/runtime/library").Decimal;
            iva: import("@prisma/client/runtime/library").Decimal;
            gatewayResponse: import("@prisma/client/runtime/library").JsonValue;
            resultCode: string;
            resultDescription: string | null;
            resourcePath: string | null;
        };
        paymentResult: any;
        success: boolean;
    }>;
    getDueSubscriptions(): Promise<({
        customer: {
            id: string;
            merchantCustomerId: string;
            email: string;
            givenName: string;
            middleName: string;
            surname: string;
            createdAt: Date;
            updatedAt: Date;
        };
        token: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            token: string;
            brand: string;
            last4: string;
            expiryMonth: number;
            expiryYear: number;
            isActive: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        tokenId: string;
        planType: import("@prisma/client").$Enums.SubscriptionPlan;
        status: import("@prisma/client").$Enums.SubscriptionStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        nextBillingDate: Date;
        lastBillingDate: Date | null;
        failedAttempts: number;
        maxRetries: number;
    })[]>;
    pauseSubscription(subscriptionId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        tokenId: string;
        planType: import("@prisma/client").$Enums.SubscriptionPlan;
        status: import("@prisma/client").$Enums.SubscriptionStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        nextBillingDate: Date;
        lastBillingDate: Date | null;
        failedAttempts: number;
        maxRetries: number;
    }>;
    cancelSubscription(subscriptionId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        tokenId: string;
        planType: import("@prisma/client").$Enums.SubscriptionPlan;
        status: import("@prisma/client").$Enums.SubscriptionStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        nextBillingDate: Date;
        lastBillingDate: Date | null;
        failedAttempts: number;
        maxRetries: number;
    }>;
    resumeSubscription(subscriptionId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        tokenId: string;
        planType: import("@prisma/client").$Enums.SubscriptionPlan;
        status: import("@prisma/client").$Enums.SubscriptionStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        nextBillingDate: Date;
        lastBillingDate: Date | null;
        failedAttempts: number;
        maxRetries: number;
    }>;
    paymentCallback(type: string, checkoutId: string, resourcePath: string, customerId?: string, planType?: string): Promise<{
        success: boolean;
        type: string;
        message: string;
        data: any;
    }>;
    jsonResponse(type: string, checkoutId: string, resourcePath: string, customerId?: string, planType?: string): Promise<any>;
}
