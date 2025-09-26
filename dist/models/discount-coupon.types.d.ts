export interface CreateDiscountCouponData {
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    expirationDate: Date;
    usageLimit?: number;
    isActive?: boolean;
}
export interface UpdateDiscountCouponData {
    code?: string;
    discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue?: number;
    expirationDate?: Date;
    usageLimit?: number;
    isActive?: boolean;
}
export interface DiscountCouponWithUsage {
    id: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    expirationDate: Date;
    usageLimit: number | null;
    usageCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    paymentHistory: CouponPaymentUsage[];
}
export interface CouponPaymentUsage {
    id: string;
    finalCost: number;
    paymentDate: Date;
    customer: {
        fullName: string;
        email: string;
    };
}
export interface CouponValidationResult {
    isValid: boolean;
    coupon?: DiscountCouponWithUsage;
    error?: string;
}
export interface CouponApplication {
    originalCost: number;
    discountAmount: number;
    finalCost: number;
    coupon: {
        code: string;
        discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
        discountValue: number;
    };
}
