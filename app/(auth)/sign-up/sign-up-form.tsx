/**
 * Sign Up Form Component
 * @module Authentication
 * @group Auth Components
 * 
 * This client component handles user registration with name, email, and password,
 * utilizing React Server Actions for form submission and state management.
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUpDefaultValues } from '@/lib/constants';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signUpUser } from '@/lib/actions/user.actions';
import { useSearchParams } from 'next/navigation';

/**
 * Form for user registration
 * 
 * This component renders a form with name, email, password, and confirm password fields,
 * handles form submission via React Server Actions, displays error messages,
 * and redirects to the requested page on successful registration.
 * 
 * Features:
 * - Name, email, and password input fields with validation
 * - Password confirmation field
 * - Form submission state management
 * - Error message display
 * - Link to sign-in page for existing users
 * 
 * @component
 * @example
 * ```tsx
 * <SignUpForm />
 * ```
 */
const SignUpForm = () => {
  /**
   * Action state from the signUpUser server action
   * 
   * @type {[{ success: boolean, message: string }, Function]}
   */
  const [data, action] = useActionState(signUpUser, {
    success: false,
    message: '',
  });

  /**
   * Search parameters from the URL, used to extract callback URL
   * @type {URLSearchParams}
   */
  const searchParams = useSearchParams();
  
  /**
   * URL to redirect to after successful sign-up
   * Defaults to home page if not specified
   * @type {string}
   */
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  /**
   * Sign-up button component with loading state
   * 
   * Displays "Submitting..." when the form is submitting
   * and disables the button to prevent multiple submissions
   * 
   * @component
   */
  const SignUpButton = () => {
    /**
     * Form submission status from React's useFormStatus hook
     * @type {Object}
     * @property {boolean} pending - Whether the form is currently submitting
     */
    const { pending } = useFormStatus();

    return (
      <Button disabled={pending} className='w-full' variant='default'>
        {pending ? 'Submitting...' : 'Sign Up'}
      </Button>
    );
  };

  return (
    <form action={action}>
      <input type='hidden' name='callbackUrl' value={callbackUrl} />
      <div className='space-y-6'>
        <div>
          <Label htmlFor='email'>Name</Label>
          <Input
            id='name'
            name='name'
            type='text'
            autoComplete='name'
            defaultValue={signUpDefaultValues.name}
          />
        </div>
        <div>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            name='email'
            type='text'
            autoComplete='email'
            defaultValue={signUpDefaultValues.email}
          />
        </div>
        <div>
          <Label htmlFor='password'>Password</Label>
          <Input
            id='password'
            name='password'
            type='password'
            required
            autoComplete='password'
            defaultValue={signUpDefaultValues.password}
          />
        </div>
        <div>
          <Label htmlFor='confirmPassword'>Confirm Password</Label>
          <Input
            id='confirmPassword'
            name='confirmPassword'
            type='password'
            required
            autoComplete='confirmPassword'
            defaultValue={signUpDefaultValues.confirmPassword}
          />
        </div>
        <div>
          <SignUpButton />
        </div>

        {/* Error message display */}
        {data && !data.success && (
          <div className='text-center text-destructive'>{data.message}</div>
        )}

        <div className='text-sm text-center text-muted-foreground'>
          Already have an account?{' '}
          <Link href='/sign-in' target='_self' className='link'>
            Sign In
          </Link>
        </div>
      </div>
    </form>
  );
};

export default SignUpForm;
