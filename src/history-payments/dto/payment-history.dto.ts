import { PaymentType, PaymentStatus } from '@prisma/client';

export class PaymentHistoryItemDto {
  id: string;
  customerName: string;
  customerIdentification: string;
  paymentType: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: Date;
  merchantTransactionId: string;
}

export class PaymentHistoryResponseDto {
  data: PaymentHistoryItemDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class PaymentDetailDto {
  id: string;
  
  // Información del cliente
  customer: {
    id: string;
    merchantCustomerId: string;
    email: string;
    givenName: string;
    middleName: string;
    surname: string;
    identificationDocType: string;
    identificationDocId: string;
    phone: string;
    street1: string;
    city: string;
    state: string;
    country: string;
    postcode: string;
  };

  // Información del pago
  payment: {
    merchantTransactionId: string;
    paymentType: PaymentType;
    amount: number;
    currency: string;
    base0: number;
    baseImp: number;
    iva: number;
    status: PaymentStatus;
    createdAt: Date;
    updatedAt: Date;
  };

  // Información del gateway
  gateway: {
    resultCode: string;
    resultDescription: string | null;
    resourcePath: string | null;
    gatewayResponse: any;
  };

  // Información de suscripción (si aplica)
  subscription?: {
    id: string;
    planType: string;
    status: string;
    nextBillingDate: Date;
  };

  // Información del token (si aplica)
  token?: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
}
