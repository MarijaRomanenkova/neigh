import { z } from 'zod';
import {
  insertTaskSchema,
  insertCartSchema,
  insertInvoiceSchema,
  paymentResultSchema,
  invoiceSchema,
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
  /** Task ID */
  id: string;
  /** Task name */
  name: string;
  /** Task description */
  description?: string | null;
  /** Task price */
  price: number;
  /** Task images */
  images: string[];
  /** Task category ID */
  categoryId: string;
  /** Task status ID */
  statusId?: string | null;
  /** Task created at timestamp */
  createdAt: Date;
  /** Task updated at timestamp */
  updatedAt?: Date;
  /** Whether task is archived */
  isArchived: boolean;
  /** When task was archived */
  archivedAt?: Date | null;
  /** Task author */
  author?: {
    id?: string;
    name?: string;
    email?: string;
    clientRating?: number | null;
  };
  /** Task category */
  category?: {
    id: string;
    name: string;
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

// Note: TaskWithOwner interface and normalizeTaskOwner function were removed (April 2025) 
// after standardizing on createdById across the database schema and application code.

export interface TaskAssignment {
  /** Task Assignment ID */
  id: string;
  /** Task Assignment Status */
  status: { name: string };
  /** Associated Task */
  task: {
    id: string;
    name: string;
    description: string;
    dueDate: string | null;
  };
  /** Client who created the task */
  client: {
    id?: string;
    name: string;
    email: string;
    image: string | null;
  };
  /** Contractor assigned to the task */
  contractor?: {
    id?: string;
    name: string;
    email: string;
    image: string | null;
  };
  /** Neighbour who helped with the task */
  neighbour?: {
    id?: string;
    name: string;
    email: string;
    image: string | null;
  };
  /** IDs for references */
  clientId?: string;
  contractorId?: string;
  neighbourId?: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Invoice information */
  invoices: TaskAssignmentInvoice[];
  /** Associated conversation */
  conversation: { id: string } | null;
  /** Reviews array from database */
  reviews?: Array<{
    rating: number;
    description: string;
    createdAt: string | Date;
    reviewType: {
      name: string;
    };
  }>;
  /** Whether client review of contractor exists */
  wasReviewed?: boolean;
  /** Client review rating (1-5) */
  reviewRating?: number;
  /** Client review feedback text */
  reviewFeedback?: string;
  /** Whether contractor review of client exists */
  wasClientReviewed?: boolean;
  /** Contractor review rating of client (1-5) */
  clientReviewRating?: number;
  /** Contractor review feedback of client */
  clientReviewFeedback?: string;
  /** Whether neighbour was reviewed */
  wasNeighbourReviewed?: boolean;
  /** Neighbour review rating (1-5) */
  neighbourReviewRating?: number;
  /** Neighbour review feedback text */
  neighbourReviewFeedback?: string;
}

/**
 * Simplified invoice type used in task assignment contexts
 */
export interface TaskAssignmentInvoice {
  /** Unique identifier */
  id: string;
  /** Invoice status */
  status: string;
  /** Invoice amount */
  amount: number;
  /** Creation date */
  createdAt: string;
}

