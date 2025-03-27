/**
 * Email Service Module
 * @module Email
 * 
 * This module provides email sending functionality for various application features.
 * It leverages the Resend email service to send transactional emails with React templates.
 */

import { Resend } from 'resend';
import { SENDER_EMAIL, APP_NAME } from '@/lib/constants';
import { Payment } from '@/types';
import dotenv from 'dotenv';
dotenv.config();

import PurchaseReceiptEmail from './purchase-receipt';

// Initialize Resend client with API key
const resend = new Resend(process.env.RESEND_API_KEY as string);

/**
 * Sends a purchase receipt email to a user after successful payment
 * 
 * Generates and sends a formatted email receipt containing:
 * - Payment ID and date
 * - Invoices included in the payment
 * - Payment total and subtotals
 * 
 * @param {Object} params - Function parameters
 * @param {Payment} params.payment - Payment object containing user and invoice details
 * @returns {Promise<void>} A promise that resolves when the email is sent
 */
export const sendPurchaseReceipt = async ({ payment }: { payment: Payment }) => {
  await resend.emails.send({
    from: `${APP_NAME} <${SENDER_EMAIL}>`,
    to: payment.user.email,
    subject: `Payment Confirmation ${payment.id}`,
    react: <PurchaseReceiptEmail payment={payment} />,
  });
};
