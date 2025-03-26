import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import OverviewPage from './overview/page';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  return <OverviewPage />;
}
