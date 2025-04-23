import { Prisma } from '@prisma/client';

export interface User {
  id: string;
  name: string | null;
  image: string | null;
}

export interface Message {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: Date;
  senderId: string;
  sender: User;
  isSystemMessage?: boolean;
  metadata?: {
    eventType?: 'status-update' | 'invoice-created' | 'review-submitted';
    taskAssignmentId?: string;
    taskName?: string;
    reviewRating?: number;
    reviewFeedback?: string;
  } | null;
}

export interface DbMessage {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: Date;
  senderId: string;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
  isSystemMessage?: boolean;
  metadata?: Prisma.JsonValue;
  readAt?: Date | null;
  conversationId?: string;
}

export interface MessageMetadata {
  eventType?: 'status-update' | 'invoice-created' | 'review-submitted';
  taskAssignmentId?: string;
  taskName?: string;
  reviewRating?: number;
  reviewFeedback?: string;
} 

export interface MessageData {
  conversationId: string;
  message: {
    id: string;
    content: string;
    senderId: string;
    timestamp: Date;
    [key: string]: unknown; // For any additional properties
  };
}

export interface Conversation {
  id: string;
  updatedAt: Date;
  task: {
    id: string;
    name: string;
  } | null;
  participants: {
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }[];
  messages: {
    id: string;
    content: string;
    createdAt: Date;
    readAt: Date | null;
    senderId: string;
    sender: {
      id: string;
      name: string | null;
    };
  }[];
} 
