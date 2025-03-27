/**
 * Categories API Route
 * @module API
 * @group Categories
 * 
 * This API endpoint provides access to task categories data.
 * It serves as a public endpoint for retrieving all available categories
 * that can be used for task classification and filtering.
 */

import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/actions/task.actions';

/**
 * GET handler for categories
 * 
 * Fetches all available task categories from the database.
 * This endpoint doesn't require authentication and returns
 * the full list of categories or an empty array if none exist.
 * 
 * @returns {Promise<NextResponse>} JSON response with categories or error details
 * @example
 * // Response format on success:
 * // [{ id: "1", name: "Cleaning" }, { id: "2", name: "Delivery" }]
 */
export async function GET() {
  try {
    console.log("Categories API called");
    
    const categories = await getAllCategories();
    
    if (!categories || categories.length === 0) {
      console.log("No categories found");
    } else {
      console.log(`Found ${categories.length} categories`);
    }
    
    return NextResponse.json(categories || []);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
