/**
 * Email Verification Template
 * @module Email/Templates
 * 
 * This component renders an HTML email template for account verification links.
 * It includes the user's name, a verification link, and instructions for completing registration.
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

interface EmailVerificationProps {
  name: string;
  verificationLink: string;
}

export default function EmailVerification({
  name,
  verificationLink,
}: EmailVerificationProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your {APP_NAME} account</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="bg-white p-8 rounded-lg shadow-lg my-8 mx-auto max-w-md">
            <Heading className="text-2xl font-bold text-center text-gray-800 mb-4">
              Verify Your Email Address
            </Heading>
            
            <Section className="mb-6">
              <Text className="text-gray-700 mb-4">
                Hello {name},
              </Text>
              <Text className="text-gray-700 mb-4">
                Thank you for signing up with {APP_NAME}. To complete your registration and activate your account, 
                please click the button below:
              </Text>
              <Button 
                href={verificationLink}
                className="bg-primary text-white px-6 py-3 rounded-md font-medium text-center block mx-auto"
              >
                Verify Email Address
              </Button>
            </Section>
            
            <Section className="border-t border-gray-200 pt-6">
              <Text className="text-gray-600 text-sm mb-4">
                This link will expire in 24 hours. If you didn&apos;t request this verification, 
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
EmailVerification.PreviewProps = {
  name: "John Doe",
  verificationLink: "https://example.com/verify-email?token=abc123",
} as EmailVerificationProps; 
