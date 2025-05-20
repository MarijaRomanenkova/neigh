# Code Examples for Presentation

## 1. Data Structure - Task Type
```typescript
// types/task.types.ts
export interface Task {
  id: string;
  name: string;
  description: string;
  price: number;
  author: {
    id: string;
    name: string;
    clientRating: number;
  };
  category: {
    id: string;
    name: string;
  };
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 2. Real-time Communication - Socket Implementation
```typescript
// components/shared/chat/chat-interface.tsx
useEffect(() => {
  if (!socket || !isConnected) return;

  const handleNewMessage = (message: ExtendedMessage) => {
    setMessages(prev => [...prev, message]);
    if (message.senderId !== session?.user?.id) {
      setUnreadMessages(prev => new Set([...prev, message.id]));
    }
  };

  socket.on('new-message', handleNewMessage);
  return () => {
    socket.off('new-message', handleNewMessage);
  };
}, [socket, isConnected, session?.user?.id]);
```

## 3. Form Processing - Task Creation
```typescript
// components/shared/task/task-form.tsx
const handleSubmit = async (data: TaskFormData) => {
  try {
    const result = await createTask({
      name: data.name,
      description: data.description,
      price: Number(data.price),
      categoryId: data.categoryId,
    });
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      router.push('/user/dashboard/client/tasks');
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to create task",
      variant: "destructive",
    });
  }
};
```

## 4. Authentication Flow - Protected Route
```typescript
// middleware.ts
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');

    if (isAuthPage) {
      if (isAuth) {
        return Response.redirect(new URL('/user/dashboard', req.url));
      }
      return null;
    }

    if (!isAuth) {
      return Response.redirect(new URL('/auth/signin', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
);
```

## 5. API Route - Task Search
```typescript
// app/api/tasks/route.ts
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const price = searchParams.get('price');
    const sort = searchParams.get('sort') as 'newest' | 'lowest' | 'highest';
    const page = Number(searchParams.get('page')) || 1;

    const tasks = await getAllTasks({
      query,
      category,
      price,
      sort,
      page,
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
```

## 6. Testing - Task Component Test
```typescript
// components/shared/task/__tests__/task-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from '../task-card';
import { useSession } from 'next-auth/react';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    name: 'Test Task',
    description: 'Test Description',
    price: 100,
    author: {
      id: 'user1',
      name: 'Test User',
      clientRating: 4.5,
    },
    category: {
      id: 'cat1',
      name: 'Test Category',
    },
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('renders task information correctly', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: 'user1' } },
    });

    render(<TaskCard task={mockTask} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('shows edit button for task owner', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: 'user1' } },
    });

    render(<TaskCard task={mockTask} />);
    
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });
});
```

## 7. Documentation - Component Documentation
```typescript
/**
 * Task Card Component
 * @module Components
 * @group Shared/Tasks
 * 
 * A client-side component that renders a card displaying task information in a compact format.
 * Features include:
 * - Task name and truncated description
 * - Price display (or "For negotiation" if no price)
 * - Author information with rating
 * - Image display with fallback
 * - Action buttons (edit/contact) based on user role
 * - Archive functionality for task owners
 * 
 * @example
 * ```tsx
 * <TaskCard
 *   task={{
 *     id: "task123",
 *     name: "Garden Maintenance",
 *     description: "Weekly garden maintenance required",
 *     price: 100,
 *     images: ["image1.jpg"],
 *     author: {
 *       name: "John Doe",
 *       clientRating: 4.5
 *     }
 *   }}
 * />
 * ```
 */

import { Task } from '@/types';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

interface TaskCardProps {
  task: Task;
  className?: string;
}

export default function TaskCard({ task, className = '' }: TaskCardProps) {
  // Component implementation...
}
``` 
