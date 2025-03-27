'use server';

/**
 * Category management functions for retrieving and working with task categories
 * @module CategoryActions
 * @group API
 */

import { prisma } from '@/db/prisma';

/**
 * Retrieves all task categories ordered alphabetically by name
 * 
 * @returns Array of category objects with id and name properties
 * 
 * @example
 * // In a category dropdown component
 * const CategorySelector = async () => {
 *   const categories = await getCategories();
 *   
 *   return (
 *     <select>
 *       <option value="">Select a category</option>
 *       {categories.map(category => (
 *         <option key={category.id} value={category.id}>
 *           {category.name}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * };
 */
export async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc'
    },
    select: {
      id: true,
      name: true,
    }
  });

  return categories;
} 
