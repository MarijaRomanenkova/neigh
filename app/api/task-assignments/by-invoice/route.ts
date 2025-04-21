/**
 * DEPRECATED: This API route is no longer in use.
 * The application now uses the getTaskAssignmentByInvoiceNumber server action directly.
 * 
 * This file is kept for reference purposes and backward compatibility.
 * 
 * API Route to find task assignment by invoice ID or invoice item ID
 * @module API
 * @group TaskAssignments
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

/**
 * GET handler to retrieve task assignment ID associated with an invoice
 * 
 * @param {Request} request - The incoming request with invoice or invoiceItem in searchParams
 * @returns {Promise<NextResponse>} JSON response with taskAssignmentId or error details
 */
export async function GET(request: Request) {
  // ... existing code ...
} 
