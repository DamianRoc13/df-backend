export interface CreatePlanData {
    name: string;
    description?: string;
    cost: number;
}
export interface UpdatePlanData {
    name?: string;
    description?: string;
    cost?: number;
}
export interface PlanWithPayments {
    id: string;
    name: string;
    description: string | null;
    cost: number;
    createdAt: Date;
    updatedAt: Date;
    paymentHistory: PaymentBasic[];
}
export interface PaymentBasic {
    id: string;
    finalCost: number;
    paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
    paymentDate: Date;
    customer: {
        fullName: string;
        email: string;
    };
}
