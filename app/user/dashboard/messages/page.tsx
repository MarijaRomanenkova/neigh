import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ConversationList from '@/components/shared/chat/conversation-list';

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
