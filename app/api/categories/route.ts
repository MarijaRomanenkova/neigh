import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/actions/task.actions';

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
