import { User } from './chat/message.types';

export interface UserWithRating extends User {
  contractorRating?: number | null;
  clientRating?: number | null;
} 
