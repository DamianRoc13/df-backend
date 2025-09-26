export interface CreateCustomerData {
    fullName: string;
    email: string;
    phoneNumber?: string;
}
export interface UpdateCustomerData {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
}
export interface CustomerWithPayments {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    createdAt: Date;
    updatedAt: Date;
    paymentHistory: PaymentHistoryBasic[];
}
export interface PaymentHistoryBasic {
    id: string;
    planCost: number;
    discountAmount: number;
    finalCost: number;
    paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
    paymentDate: Date;
    plan: {
        name: string;
        description: string | null;
    };
    discountCoupon: {
        couponName: string;
    } | null;
}
