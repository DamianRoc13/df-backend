export interface CreateAdministratorData {
    fullName: string;
    email: string;
    username: string;
    password: string;
}
export interface UpdateAdministratorData {
    fullName?: string;
    email?: string;
    username?: string;
    password?: string;
    isActive?: boolean;
}
export interface AdministratorWithoutPassword {
    id: string;
    fullName: string;
    email: string;
    username: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface AdministratorLoginData {
    username?: string;
    email?: string;
    password: string;
}
export interface AdministratorLoginResponse {
    administrator: AdministratorWithoutPassword;
    accessToken: string;
    refreshToken?: string;
}
export interface AdministratorSession {
    id: string;
    fullName: string;
    email: string;
    username: string;
    isActive: boolean;
}
export interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}
export interface AdminDashboardStats {
    totalCustomers: number;
    totalPlans: number;
    totalPayments: number;
    totalRevenue: number;
    activeDiscountCoupons: number;
    recentPayments: PaymentHistoryWithDetails[];
}
import type { PaymentHistoryWithDetails } from './payment-history.types';
