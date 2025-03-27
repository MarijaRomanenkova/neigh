'use server';

/**
 * User authentication and profile management functions
 * @module UserActions
 * @group API
 */

import {
  signInFormSchema,
  signUpFormSchema,
  paymentMethodSchema,
  updateUserSchema,
  updateProfileSchema,
} from '@/lib/validators';
import { auth, signIn, signOut } from '@/auth';
import { hashSync } from 'bcrypt-ts';
import { prisma } from '@/db/prisma';
import { formatError } from '@/lib/utils';
import { z } from 'zod';
import { PAGE_SIZE } from '../constants';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { getMyCart } from './cart.actions';

/**
 * Authenticates a user with email and password credentials
 * 
 * @param prevState - Previous form state
 * @param formData - Form data containing email and password
 * @returns Authentication result with success status and message
 * 
 * @example
 * // In a React Server Action component:
 * const [state, formAction] = useFormState(signInWithCredentials, { 
 *   success: false, 
 *   message: '' 
 * });
 */
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData
) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    // We don't want to throw a redirect from here so we can handle it in the component
    await signIn('credentials', {
      ...user,
      redirect: false
    });

    return { success: true, message: 'Signed in successfully' };
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    return { success: false, message: 'Invalid email or password' };
  }
}

/**
 * Signs out the current user and cleans up their cart
 * 
 * @returns Redirects to the sign-in page
 * 
 * @example
 * // In a client component:
 * <button onClick={() => signOutUser()}>Sign Out</button>
 */
export async function signOutUser() {
  // get current users cart and delete it so it does not persist to next user
  const currentCart = await getMyCart();

  if (currentCart?.id) {
    await prisma.cart.delete({ where: { id: currentCart.id } });
  } else {
    console.warn('No cart found for deletion.');
  }
  await signOut();
}

/**
 * Registers a new user and signs them in
 * 
 * @param prevState - Previous form state
 * @param formData - Form data containing user registration details
 * @returns Registration result with success status and message
 * 
 * @example
 * // In a React Server Action component:
 * const [state, formAction] = useFormState(signUpUser, { 
 *   success: false, 
 *   message: '' 
 * });
 */
export async function signUpUser(prevState: unknown, formData: FormData) {
  try {
    const user = signUpFormSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    });

    const plainPassword = user.password;

    user.password = hashSync(user.password, 10);

    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
      },
    });

    await signIn('credentials', {
      email: user.email,
      password: plainPassword,
    });

    return { success: true, message: 'User registered successfully' };
  } catch (error) {
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
          throw error;
        }
    return { success: false, message: formatError(error) };
  }
}

/**
 * Retrieves a user by their ID
 * 
 * @param userId - The user's unique identifier
 * @returns The user object with numeric conversions for decimal values
 * @throws Error if user is not found
 * 
 * @example
 * try {
 *   const user = await getUserById('user-123');
 *   console.log(user.name);
 * } catch (error) {
 *   console.error('User not found');
 * }
 */
export async function getUserById(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId },
  });
  if (!user) throw new Error('User not found');
  
  // Handle Decimal objects by converting them to regular numbers
  return {
    ...user,
    clientRating: user.clientRating !== null ? Number(user.clientRating) : null,
    contractorRating: user.contractorRating !== null ? Number(user.contractorRating) : null
  };
}

/**
 * Updates the current user's preferred payment method
 * 
 * @param data - Payment method data containing the payment type
 * @returns Update result with success status and message
 * 
 * @example
 * const result = await updateUserPaymentMethod({ type: 'Stripe' });
 * if (result.success) {
 *   showToast('Payment method updated');
 * }
 */
export async function updateUserPaymentMethod(
  data: z.infer<typeof paymentMethodSchema>
) {
  try {
    const session = await auth();
    const currentUser = await prisma.user.findFirst({
      where: { id: session?.user?.id },
    });

    if (!currentUser) throw new Error('User not found');

    const paymentMethod = paymentMethodSchema.parse(data);

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { paymentMethod: paymentMethod.paymentMethod },
    });

    return {
      success: true,
      message: 'User updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Updates the current user's profile information
 * 
 * @param user - User profile data to update
 * @returns Update result with success status and message
 * 
 * @example
 * const result = await updateProfile({
 *   name: 'John Doe',
 *   fullName: 'John Robert Doe',
 *   phoneNumber: '+1234567890'
 * });
 */
export async function updateProfile(user: z.infer<typeof updateProfileSchema>) {
  try {
    const session = await auth();

    const currentUser = await prisma.user.findFirst({
      where: {
        id: session?.user?.id,
      },
    });

    if (!currentUser) throw new Error('User not found');

    await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        name: user.name,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        companyId: user.companyId,
        // Handle address as a string that gets converted to JSON
        address: user.address ? JSON.stringify({ address: user.address }) : undefined,
      },
    });

    return {
      success: true,
      message: 'Profile updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Retrieves users with pagination and optional filtering
 * 
 * @param options - Query options for retrieving users
 * @param options.limit - Maximum number of users to retrieve per page
 * @param options.page - Page number to retrieve
 * @param options.query - Optional search query to filter users by name
 * @returns Paginated list of users and total page count
 * 
 * @example
 * const { data, totalPages } = await getAllUsers({
 *   page: 1,
 *   query: 'john'
 * });
 */
export async function getAllUsers({
  limit = PAGE_SIZE,
  page,
  query,
}: {
  limit?: number;
  page: number;
  query: string;
}) {
  const queryFilter: Prisma.UserWhereInput =
    query && query !== 'all'
      ? {
          name: {
            contains: query,
            mode: 'insensitive',
          } as Prisma.StringFilter,
        }
      : {};

  const data = await prisma.user.findMany({
    where: {
      ...queryFilter,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.user.count();

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

/**
 * Deletes a user by their ID
 * 
 * @param id - The user's unique identifier
 * @returns Delete result with success status and message
 * 
 * @example
 * const result = await deleteUser('user-123');
 * if (result.success) {
 *   showToast('User deleted successfully');
 * }
 */
export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });

    revalidatePath('/admin/users');

    return {
      success: true,
      message: 'User deleted successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

/**
 * Updates a user's information (admin functionality)
 * 
 * @param user - User data to update including ID, name and role
 * @returns Update result with success status and message
 * 
 * @example
 * const result = await updateUser({
 *   id: 'user-123',
 *   name: 'John Doe',
 *   role: 'admin'
 * });
 */
export async function updateUser(user: z.infer<typeof updateUserSchema>) {
  try {
    if (!user.id) {
      throw new Error('User ID is required');
    }

    // Create update data object with required fields
    const updateData: Prisma.UserUpdateInput = {
      name: user.name,
    };
    
    // Add role if provided
    if (user.role) {
      updateData.role = user.role;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    revalidatePath('/admin/users');

    return {
      success: true,
      message: 'User updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
