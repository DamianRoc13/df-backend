export * from './customer.types';
export * from './plan.types';
export * from './discount-coupon.types';
export * from './payment-history.types';
export * from './administrator.types';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface ValidationError {
    field: string;
    message: string;
}
export interface ApiError {
    statusCode: number;
    message: string;
    errors?: ValidationError[];
}
