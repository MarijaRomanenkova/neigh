import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (name) {
      // Get specific status by name
      const status = await prisma.taskStatus.findFirst({
        where: { 
          name: name.toUpperCase() 
        }
      });

      if (!status) {
        return NextResponse.json(
          { error: `Status "${name}" not found` }, 
          { status: 404 }
        );
      }

      return NextResponse.json(status);
    } else {
      // Get all statuses
      const statuses = await prisma.taskStatus.findMany({
        orderBy: { order: 'asc' }
      });
      
      return NextResponse.json(statuses);
    }
  } catch (error) {
    console.error('Error fetching task statuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task statuses' },
      { status: 500 }
    );
  }
} 
