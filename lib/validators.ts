/**
 * Data Validation Schemas Module
 * @module Lib/Validators
 * 
 * This module provides Zod validation schemas for various data structures used throughout the application.
 * Each schema defines the shape, types, and validation rules for a specific data entity or form.
 */

import { z } from 'zod';
import { formatNumberWithDecimal } from './utils';

// Create a custom currency schema type
const currency = z
  .number()
  .or(z.string())
  .pipe(
    z.coerce
      .number()
      .min(0, 'Price must be greater than 0')
      .transform((val) => Number(formatNumberWithDecimal(val)))
  );

// Invoice Items Schema
const invoiceItemsSchema = z.object({
  id: z.string().optional(),
  taskId: z.string().min(1, 'Task is required'),
  description: z.string().min(1, 'Description is required').optional(),
  price: currency,
  quantity: z.number().int().positive('Quantity must be positive'),
  pricePerUnit: currency.optional(),
  totalPrice: currency.optional(),
  rate: z.string().optional(),
});

// Define constants
const PAYMENT_METHODS = ['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER'];

/**
 * Task Insertion Schema
 * 
 * Validates data required to create a new task in the system.
 * @property {string} name - Task name (3-255 characters)
 * @property {string} slug - URL-friendly task identifier
 * @property {string} categoryId - ID of the category the task belongs to
 * @property {number} price - Task price (minimum 0)
 */
export const insertTaskSchema = z.object({
  name: z.string().min(3).max(255),
  slug: z.string(),
  categoryId: z.string(),
  images: z.array(z.string()),
  description: z.string().min(12, 'Description must be at least 12 characters'),
  price: z.coerce.number().min(0),
});

/**
 * Task Update Schema
 * 
 * Validates data for updating an existing task.
 * @property {string} name - Task name (3-255 characters)
 * @property {string} slug - URL-friendly task identifier
 * @property {string} categoryId - ID of the category the task belongs to
 * @property {number} price - Task price (minimum 0)
 */
export const updateTaskSchema = insertTaskSchema;

/**
 * Sign-In Form Schema
 * 
 * Validates user sign-in form data.
 * @property {string} email - User email address (must be valid email format)
 * @property {string} password - User password (minimum 8 characters)
 */
export const signInFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * Sign-Up Form Schema
 * 
 * Validates user registration form data.
 * @property {string} name - User's full name
 * @property {string} email - User email address (must be valid email format)
 * @property {string} password - User password (minimum 8 characters)
 */
export const signUpFormSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * Payment Method Schema
 * 
 * Validates the payment method selection.
 * @property {string} paymentMethod - Selected payment method (must be one of the predefined options)
 */
export const paymentMethodSchema = z.object({
  paymentMethod: z.enum(['PAYPAL', 'STRIPE']),
});

/**
 * Invoice Insertion Schema
 * 
 * Validates data required to create a new invoice.
 * @property {string} clientId - ID of the client receiving the invoice
 * @property {string} contractorId - ID of the contractor issuing the invoice
 * @property {number} totalPrice - Total invoice amount
 * @property {array} items - Array of invoice line items
 */
export const insertInvoiceSchema = z.object({
  clientId: z.string(),
  contractorId: z.string(),
  totalPrice: z.coerce.number(),
  items: z.array(
    z.object({
      id: z.string().optional(),
      taskId: z.string(),
      quantity: z.coerce.number().min(1),
      price: z.coerce.number().min(0),
    })
  ),
});

/**
 * Invoice Update Schema
 * 
 * Validates data for updating an existing invoice.
 * @property {string} id - Invoice ID
 * @property {number} totalPrice - Updated total invoice amount
 * @property {array} items - Updated array of invoice line items
 */
export const updateInvoiceSchema = z.object({
  id: z.string(),
  totalPrice: z.coerce.number(),
  items: z.array(
    z.object({
      id: z.string().optional(),
      taskId: z.string(),
      quantity: z.coerce.number().min(1),
      price: z.coerce.number().min(0),
    })
  ),
});

/**
 * Payment Update Schema
 * 
 * Validates data for updating a payment record.
 * @property {string} id - Payment ID
 * @property {string} paymentMethod - Selected payment method
 */
export const updatePaymentSchema = z.object({
  id: z.string(),
  paymentMethod: z.enum(['PAYPAL', 'STRIPE']),
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

/**
 * Update User Profile Schema
 * 
 * Validates data for updating a user's profile information.
 * @property {string} id - User ID
 * @property {string} name - User's updated full name
 * @property {string} email - User's updated email address (must be valid email format)
 * @property {string} role - User's role in the system
 */
export const updateUserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().optional()
});

export const invoiceSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  contractorId: z.string(),
  isPaid: z.boolean(),
  paymentDueDate: z.date().or(z.string()),
  status: z.string(),
  issueDate: z.date().or(z.string()),
  items: z.array(
    z.object({
      id: z.string(),
      taskId: z.string(),
      invoiceId: z.string(),
      quantity: z.number(),
      price: z.number(),
    })
  ),
});

/**
 * Cart Schema
 * 
 * Validates shopping cart data.
 * @property {string} userId - ID of the user who owns the cart
 * @property {number} totalPrice - Total price of all items in the cart
 * @property {array} items - Array of cart items with tasks and quantities
 */
export const cartSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  sessionCartId: z.string(),
  totalPrice: z.number().or(z.string()).pipe(z.coerce.number().multipleOf(0.01)),
  createdAt: z.date().or(z.string().datetime()).default(() => new Date()),
  invoices: z.array(z.object({
    id: z.string().uuid()
  })).optional(),
  items: z.array(
    z.object({
      taskId: z.string(),
      quantity: z.coerce.number().min(1),
    })
  ),
});

/**
 * Insert Cart Schema
 * 
 * Validates data for creating a new shopping cart.
 * Omits certain fields that are auto-generated.
 */
export const insertCartSchema = cartSchema.omit({ 
  id: true, 
  createdAt: true,
  invoices: true 
});

/**
 * Update Cart Schema
 * 
 * Validates data for updating an existing shopping cart.
 * Makes all fields optional except essential identifiers.
 */
export const updateCartSchema = cartSchema.partial().omit({ 
  id: true, 
  createdAt: true 
});

/**
 * Update Profile Schema
 * 
 * Validates data for updating a user's profile information.
 * @property {string} name - User's display name
 * @property {string} fullName - User's complete legal name
 * @property {string} phoneNumber - User's contact phone number
 * @property {string} companyId - ID of the company the user is associated with (optional)
 * @property {string} address - User's address information (optional)
 */
export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  fullName: z.string().optional(),
  phoneNumber: z.string().optional(),
  companyId: z.string().optional(),
  address: z.string().optional(),
});

/**
 * Task Assignment Schema
 * 
 * Validates data for assigning a task to a contractor.
 * @property {string} taskId - ID of the task being assigned
 * @property {string} contractorId - ID of the contractor receiving the assignment
 * @property {string} statusId - Status ID for the assignment
 * @property {string} clientId - ID of the client requesting the task
 */
export const insertTaskAssignmentSchema = z.object({
  taskId: z.string().min(1, 'Task is required'),
  contractorId: z.string().min(1, 'Contractor is required'),
  statusId: z.string().min(1, 'Status is required'),
  clientId: z.string().min(1, 'Client is required'),
});

/**
 * Update Task Assignment Schema
 * 
 * Validates data for updating an existing task assignment.
 * Makes all fields from the insertion schema optional.
 */
export const updateTaskAssignmentSchema = insertTaskAssignmentSchema.partial();
