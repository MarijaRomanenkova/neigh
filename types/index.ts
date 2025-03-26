import { z } from 'zod';
import {
  insertTaskSchema,
  insertCartSchema,
  insertInvoiceSchema,
  paymentResultSchema,
  invoiceSchema,
  invoiceItemsSchema,
} from '@/lib/validators';
import { Decimal } from '@prisma/client/runtime/library';

export interface Task {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  slug: string;
  categoryId: string;
  images: string[];
  price: number;
  statusId: string;
  createdById: string | null;
  author?: {
    name: string;
    email?: string;
  };
}

export type Cart = {
  id: string;
  userId?: string;
  sessionCartId: string;
  invoices: Invoice[];
  totalPrice: string | Decimal;
  createdAt: Date;
};

export type Payment = {
  id: string;
  createdAt: Date;
  isPaid: boolean;
  paidAt: Date | null;
  totalPrice: string;
  taxPrice: string;
  paymentMethod: string;
  user: {
    name: string;
    email: string;
  };
  invoices: {
    id: string;
    invoiceNumber: string;
    totalPrice: number;
    client: {
      name: string;
    };
  }[];
  paymentResult?: {
    id: string;
    status: string;
    amount: string;
    email_address: string;
    created_at: string;
  };
};

export type PaymentResult = {
  id: string;
  status: string;
  email_address: string;
  pricePaid: string;
  amount: string;
  created_at: string;
};

export type UpdatePaymentToPaidParams = {
  paymentId: string;
  paymentResult: PaymentResult;
};

export type InvoiceItem = {
  id: string;
  name: string;
  taskId: string;
  price: string | Decimal;
  qty?: number;
  hours?: number;
  description?: string;
  invoiceId: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  totalPrice: string | Decimal;
  clientId: string;
  contractorId: string;
  client: {
    name: string;
    email: string;
  };
  contractor: {
    name: string;
    email: string;
  };
  items: InvoiceItem[];
  createdAt: Date;
  isPaid?: boolean;
  paidAt?: Date | null;
};

export type InvoiceItems = {
  name: string;
  taskId: string;
  price: string;
  qty?: number;
};

export type InvoiceItemsArray = InvoiceItems[];

export type CartActionResponse = {
  success: boolean;
  message?: string;
  cart?: Cart;
}

export type Category = {
  id: string;
  name: string;
  description: string | null;
  _count: {
    tasks: number;
  };
};

export interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  companyId?: string | null;
  address?: Record<string, unknown> | string | null;
  clientRating?: number | null;
  contractorRating?: number | null;
}
