/**
 * Password Reset Email Template
 * @module Email/Templates
 * 
 * This component renders an HTML email template for password reset links.
 * It includes the user's name, a reset link, and instructions for resetting their password.
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import { APP_NAME } from '@/lib/constants';

interface PasswordResetEmailProps {
  name: string;
  resetLink: string;
}

export default function PasswordResetEmail({
  name,
  resetLink,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your {APP_NAME} password</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="bg-white p-8 rounded-lg shadow-lg my-8 mx-auto max-w-md">
            <Heading className="text-2xl font-bold text-center text-gray-800 mb-4">
              Password Reset
            </Heading>
            
            <Section className="mb-6">
              <Text className="text-gray-700 mb-4">
                Hello {name},
              </Text>
              <Text className="text-gray-700 mb-4">
                We received a request to reset your password for your {APP_NAME} account. 
                Click the button below to create a new password:
              </Text>
              <Button 
                href={resetLink}
                className="bg-primary text-white px-6 py-3 rounded-md font-medium text-center block mx-auto"
              >
                Reset Password
              </Button>
            </Section>
            
            <Section className="border-t border-gray-200 pt-6">
              <Text className="text-gray-600 text-sm mb-4">
                This link will expire in 1 hour. If you didn&apos;t request a password reset, 
                you can safely ignore this email.
              </Text>
              <Text className="text-gray-600 text-sm">
                For security, please don&apos;t forward this email to anyone.
              </Text>
            </Section>
            
            <Section className="text-center text-gray-500 text-xs mt-8">
              <Text>
                &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
              </Text>
              <Link 
                href="https://yoursite.com" 
                className="text-gray-500 underline"
              >
                Visit our website
              </Link>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

// Sample props for previewing the email template
PasswordResetEmail.PreviewProps = {
  name: "John Doe",
  resetLink: "https://example.com/reset-password?token=abc123",
} as PasswordResetEmailProps; 
