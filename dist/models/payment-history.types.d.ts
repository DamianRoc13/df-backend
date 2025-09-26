export interface CreatePaymentHistoryData {
    customerId: string;
    planId: string;
    originalCost: number;
    finalCost: number;
    paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
    paymentGatewayId?: string;
    discountCouponId?: string;
}
export interface UpdatePaymentHistoryData {
    paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
    paymentGatewayId?: string;
    paymentDate?: Date;
}
export interface PaymentHistoryWithDetails {
    id: string;
    originalCost: number;
    finalCost: number;
    paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
    paymentDate: Date;
    paymentGatewayId: string | null;
    createdAt: Date;
    updatedAt: Date;
    customer: {
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
    };
    plan: {
        id: string;
        name: string;
        cost: number;
    };
    discountCoupon?: {
        id: string;
        code: string;
        discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
        discountValue: number;
    };
}
export interface PaymentSummary {
    totalPayments: number;
    totalRevenue: number;
    completedPayments: number;
    pendingPayments: number;
    failedPayments: number;
    cancelledPayments: number;
    refundedPayments: number;
}
export interface PaymentFilters {
    customerId?: string;
    planId?: string;
    paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
    startDate?: Date;
    endDate?: Date;
    hasDiscount?: boolean;
}
export interface PaymentListResponse {
    payments: PaymentHistoryWithDetails[];
    total: number;
    page: number;
    limit: number;
    summary: PaymentSummary;
}
