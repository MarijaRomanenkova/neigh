/**
 * Messages Dashboard Page Component
 * @module Pages
 * @group Dashboard/Messages
 * 
 * This page displays all conversations for the logged-in user.
 * It shows a list of all message threads with other users.
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ConversationList from '@/components/shared/chat/conversation-list';

/**
 * Messages Dashboard Page Component
 * 
 * Renders a list of all conversations the user is participating in.
 * Uses the ConversationList component to display message threads.
 * 
 * Security:
 * - Validates that the user is authenticated
 * - Redirects to login page if not authenticated
 * 
 * @returns {Promise<JSX.Element>} The rendered messages page with conversation list
 */
export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <ConversationList />
    </div>
  );
} 
