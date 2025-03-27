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

/**
 * Core application types
 * @packageDocumentation
 */

/**
 * User information with authentication details and profile
 */
export interface Task {
  /** Unique identifier */
  id: string;
  /** Task name */
  name: string;
  /** Task description */
  description: string;
  /** Creation date */
  createdAt: Date;
  /** Task slug */
  slug: string;
  /** Category identifier */
  categoryId: string;
  /** Task images */
  images: string[];
  /** Task price */
  price: number;
  /** Status identifier */
  statusId: string;
  /** Identifier of the user who created the task */
  createdById: string | null;
  /** Task author information */
  author?: {
    /** Author name */
    name: string;
    /** Author email */
    email?: string;
  };
}

export type Cart = {
  /** Unique identifier */
  id: string;
  /** User identifier */
  userId?: string;
  /** Session cart identifier */
  sessionCartId: string;
  /** Invoices associated with the cart */
  invoices: Invoice[];
  /** Total price of the cart */
  totalPrice: string | Decimal;
  /** Creation date */
  createdAt: Date;
};

export type Payment = {
  /** Unique identifier */
  id: string;
  /** Creation date */
  createdAt: Date;
  /** Payment status */
  isPaid: boolean;
  /** Date of payment */
  paidAt: Date | null;
  /** Total price */
  totalPrice: string;
  /** Tax price */
  taxPrice: string;
  /** Payment method */
  paymentMethod: string;
  /** User information */
  user: {
    /** User name */
    name: string;
    /** User email */
    email: string;
  };
  /** Invoices associated with the payment */
  invoices: {
    /** Invoice identifier */
    id: string;
    /** Invoice number */
    invoiceNumber: string;
    /** Total price of the invoice */
    totalPrice: number;
    /** Client information */
    client: {
      /** Client name */
      name: string;
    };
  }[];
  /** Payment result details */
  paymentResult?: {
    /** Unique identifier */
    id: string;
    /** Payment status */
    status: string;
    /** Payment amount */
    amount: string;
    /** Email address */
    email_address: string;
    /** Creation date */
    created_at: string;
  };
};

export type PaymentResult = {
  /** Unique identifier */
  id: string;
  /** Payment status */
  status: string;
  /** Email address */
  email_address: string;
  /** Price paid */
  pricePaid: string;
  /** Payment amount */
  amount: string;
  /** Creation date */
  created_at: string;
};

export type UpdatePaymentToPaidParams = {
  /** Payment identifier */
  paymentId: string;
  /** Payment result details */
  paymentResult: PaymentResult;
};

export type InvoiceItem = {
  /** Unique identifier */
  id: string;
  /** Item name */
  name: string;
  /** Task identifier */
  taskId: string;
  /** Item price */
  price: string | Decimal;
  /** Item quantity */
  qty?: number;
  /** Item hours */
  hours?: number;
  /** Item description */
  description?: string;
  /** Invoice identifier */
  invoiceId: string;
};

export type Invoice = {
  /** Unique identifier */
  id: string;
  /** Invoice number */
  invoiceNumber: string;
  /** Total price */
  totalPrice: string | Decimal;
  /** Client identifier */
  clientId: string;
  /** Contractor identifier */
  contractorId: string;
  /** Client information */
  client: {
    /** Client name */
    name: string;
    /** Client email */
    email: string;
  };
  /** Contractor information */
  contractor: {
    /** Contractor name */
    name: string;
    /** Contractor email */
    email: string;
  };
  /** Invoice items */
  items: InvoiceItem[];
  /** Creation date */
  createdAt: Date;
  /** Payment status */
  isPaid?: boolean;
  /** Date of payment */
  paidAt?: Date | null;
};

export type InvoiceItems = {
  /** Item name */
  name: string;
  /** Task identifier */
  taskId: string;
  /** Item price */
  price: string;
  /** Item quantity */
  qty?: number;
};

export type InvoiceItemsArray = InvoiceItems[];

export type CartActionResponse = {
  /** Success status */
  success: boolean;
  /** Response message */
  message?: string;
  /** Cart information */
  cart?: Cart;
}

export type Category = {
  /** Unique identifier */
  id: string;
  /** Category name */
  name: string;
  /** Category description */
  description: string | null;
  /** Count of tasks in the category */
  _count: {
    tasks: number;
  };
};

export interface ExtendedUser {
  /** Unique identifier */
  id: string;
  /** Display name */
  name?: string | null;
  /** Email address */
  email?: string | null;
  /** User image */
  image?: string | null;
  /** User role */
  role?: string;
  /** Full name */
  fullName?: string | null;
  /** Phone number */
  phoneNumber?: string | null;
  /** Company identifier */
  companyId?: string | null;
  /** User address */
  address?: Record<string, unknown> | string | null;
  /** Client rating */
  clientRating?: number | null;
  /** Contractor rating */
  contractorRating?: number | null;
}
