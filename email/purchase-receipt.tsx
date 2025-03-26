import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import { Payment } from '@/types';
import { formatCurrency } from '@/lib/utils';

PurchaseReceiptEmail.PreviewProps = {
  payment: {
    id: 'PAYMENT-123',
    createdAt: new Date(),
    isPaid: true,
    paidAt: new Date(),
    totalPrice: '100',
    taxPrice: '21',
    paymentMethod: 'PayPal',
    invoices: [
      {
        id: 'INV-123',
        invoiceNumber: 'INV-123',
        totalPrice: 100,
        client: {
          name: 'John Doe'
        }
      }
    ],
    user: {
      name: 'John Doe',
      email: 'test@test.com'
    },
    paymentResult: {
      id: 'TR-123',
      status: 'succeeded',
      amount: '100',
      email_address: 'test@test.com',
      created_at: new Date().toISOString()
    }
  }
} satisfies PaymentInformationProps;

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

type PaymentInformationProps = {
  payment: Payment;
};

export default function PurchaseReceiptEmail({ payment }: PaymentInformationProps) {
  return (
    <Html>
      <Preview>View order receipt</Preview>
      <Tailwind>
        <Head />
        <Body className='font-sans bg-white'>
          <Container className='max-w-xl'>
            <Heading>Purchase Receipt</Heading>
            <Section>
              <Row>
                <Column>
                  <Text className='mb-0 mr-4 text-gray-500 whitespace-nowrap text-nowrap'>
                    Order ID
                  </Text>
                  <Text className='mt-0 mr-4'>{payment.id.toString()}</Text>
                </Column>
                <Column>
                  <Text className='mb-0 mr-4 text-gray-500 whitespace-nowrap text-nowrap'>
                    Purchase Date
                  </Text>
                  <Text className='mt-0 mr-4'>
                    {dateFormatter.format(payment.createdAt)}
                  </Text>
                </Column>
                <Column>
                  <Text className='mb-0 mr-4 text-gray-500 whitespace-nowrap text-nowrap'>
                    Price Paid
                  </Text>
                  <Text className='mt-0 mr-4'>
                    {formatCurrency(payment.totalPrice)}
                  </Text>
                </Column>
              </Row>
            </Section>
            <Section className='border border-solid border-gray-500 rounded-lg p-4 md:p-6 my-4'>
              {payment.invoices.map((invoice) => (
                <Row key={invoice.id} className='mt-8'>
                 
                  <Column className='align-top'>
                    {invoice.invoiceNumber}
                  </Column>
                  <Column align='right' className='align-top'>
                    {formatCurrency(invoice.totalPrice)}
                  </Column>
                </Row>
              ))}
              {[
                { name: 'Subtotal', price: payment.totalPrice },
                { name: 'Total', price: payment.totalPrice },
              ].map(({ name, price }) => (
                <Row key={name} className='py-1'>
                  <Column align='right'>{name}: </Column>
                  <Column align='right' width={70} className='align-top'>
                    <Text className='m-0'>{formatCurrency(price)}</Text>
                  </Column>
                </Row>
              ))}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
