'use server';
import { prisma } from '@/db/prisma';

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
