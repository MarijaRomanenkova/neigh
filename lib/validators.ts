import { z } from 'zod';
import { formatNumberWithDecimal } from './utils';
import { PAYMENT_METHODS } from './constants';

const currency = z
  .string()
  .refine(
    (value) => /^\d+(\.\d{2})?$/.test(formatNumberWithDecimal(Number(value))),
    'Price must have exactly two decimal places'
  );

// Schema for inserting tasks
export const insertTaskSchema = z.object({
  name: z.string(),
  slug: z.string(),
  categoryId: z.string(),
  images: z.array(z.string()),
  description: z.string().min(12, 'Description must be at least 12 characters'),
  price: z.number().int().nonnegative('Hours must be zero or positive').optional(),
});

// Schema for updating tasks
export const updateTaskSchema = insertTaskSchema.extend({
  id: z.string().min(1, 'Id is required'),
});

// Schema for signing users in
export const signInFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Schema for signing up a user
export const signUpFormSchema = z
  .object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z
      .string()
      .min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Invoice Items Schema
export const invoiceItemsSchema = z.object({
  taskId: z.string().min(1, 'task is required'),
  name: z.string().min(1, 'Name is required'),
  qty: z.number().int().nonnegative('Quantity must be a positive number').optional(),
  price: currency,
});


// Schema for payment method
export const paymentMethodSchema = z
  .object({
    type: z.string().min(1, 'Payment method is required'),
  })
  .refine((data) => PAYMENT_METHODS.includes(data.type), {
    path: ['type'],
    message: 'Invalid payment method',
  });

// Schema for creating an invoice
export const insertInvoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  contractorId: z.string().min(1, 'Contractor is required'),
  invoiceItem: z.array(invoiceItemsSchema),
  totalPrice: currency
});

export const updateInvoiceSchema = insertInvoiceSchema.partial().extend({
  id: z.string().min(1, 'Invoice ID is required'),
  clientId: z.string().min(1, 'Client is required'),
  contractorId: z.string().min(1, 'Contractor is required'),
  invoiceItem: z.array(invoiceItemsSchema),
  totalPrice: currency
});

// Schema for creating a payment
export const insertPaymentSchema = z.object({
  amount: currency,
  paymentMethod: z.string().refine((data) => PAYMENT_METHODS.includes(data), {
    message: 'Invalid payment method'
  }),
  invoiceIds: z.array(z.string().min(1, 'Invoice ID is required'))
});

// Schema for payment result
export const paymentResultSchema = z.object({
  id: z.string(),
  status: z.string(),
  email_address: z.string(),
  amount: currency,
  created_at: z.string()
});

// Schema for updating the user profile
export const updateProfileSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  fullName: z.string().optional(),
  email: z.string().min(3, 'Email must be at least 3 characters'),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  companyId: z.string().optional().describe('Contractor legal ID number'),
});

// Schema to update users
export const updateUserSchema = updateProfileSchema.extend({
  id: z.string().min(1, 'ID is required'),
  role: z.string().min(1, 'Role is required'),
});


export const invoiceSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  name: z.string(),
  qty: z.number().int().nonnegative('Quantity must be a positive number'),
  price: currency,
  contractorId: z.string().uuid(),
  clientId: z.string().uuid(),
});

export const cartSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  sessionCartId: z.string(),
  totalPrice: z.number().or(z.string()).pipe(z.coerce.number().multipleOf(0.01)),
  createdAt: z.date().or(z.string().datetime()).default(() => new Date()),
  invoices: z.array(z.object({
    id: z.string().uuid()
  })).optional()
});

// For inserting a new cart
export const insertCartSchema = cartSchema.omit({ 
  id: true, 
  createdAt: true,
  invoices: true
});

// For updating a cart
export const updateCartSchema = cartSchema.partial().omit({ 
  id: true, 
  createdAt: true 
});

export const insertTaskAssignmentSchema = z.object({
  taskId: z.string().min(1, 'Task is required'),
  contractorId: z.string().min(1, 'Contractor is required'),
  statusId: z.string().min(1, 'Status is required'),
  clientId: z.string().min(1, 'Client is required'),
});

export const updateTaskAssignmentSchema = insertTaskAssignmentSchema.partial();
