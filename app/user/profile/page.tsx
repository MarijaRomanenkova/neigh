import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ProfileForm from './profile-form';

export const metadata: Metadata = {
  title: 'Profile Settings | Neighbours',
  description: 'Update your personal and business information'
};

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      <div className="space-y-2">
        <h1 className='h2-bold'>Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your personal information and account settings
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}
