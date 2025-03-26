import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getUserById } from '@/lib/actions/user.actions';
import UpdateUserForm from './update-user-form';
import { requireAdmin } from '@/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Update User',
};

const AdminUserUpdatePage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  await requireAdmin();

  const { id } = await props.params;

  const user = await getUserById(id);

  if (!user) notFound();

  // Transform the user object to match the expected format
  const formattedUser = {
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    role: user.role || '',
    fullName: user.fullName || undefined,
    address: typeof user.address === 'string' ? user.address : undefined,
    phoneNumber: user.phoneNumber || undefined,
    companyId: user.companyId || undefined,
  };

  return (
    <div className='space-y-8 max-w-lg mx-auto'>
      <h1 className='h2-bold'>Update User</h1>
      <UpdateUserForm user={formattedUser} />
    </div>
  );
};

export default AdminUserUpdatePage;
