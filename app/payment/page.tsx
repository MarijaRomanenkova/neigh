'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Loader, ArrowLeft, CreditCard } from 'lucide-react';
import Link from 'next/link';
import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Simplified interface for invoices after retrieval
interface SimpleInvoice {
  id: string;
  invoiceNumber: string;
  totalPrice: number;
  client: {
    name: string;
  };
  contractor: {
    name: string;
  };
}

export default function PaymentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<SimpleInvoice[]>([]);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Stripe' | 'PayPal'>('Stripe');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const hasFetchedInvoices = useRef(false);
  
  // Calculate total from all invoices
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.totalPrice, 0);

  // Fetch Stripe client secret
  const fetchStripeClientSecret = useCallback(async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/stripe-intent`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create Stripe payment intent');
      }

      const data = await response.json();
      setStripeClientSecret(data.clientSecret);
    } catch (error) {
      console.error('Error creating Stripe payment intent:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to initialize Stripe payment',
      });
    }
  }, [toast]);

  // Define createPaymentRecord outside useEffect
  const createPaymentRecord = useCallback(async (invoices: SimpleInvoice[]) => {
    // Validate invoices array
    if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
      console.error('Invalid invoices provided to createPaymentRecord:', invoices);
      toast({
        variant: 'destructive',
        description: 'No valid invoices to process for payment',
      });
      return;
    }
    
    // Don't try to create a payment if we already have a payment ID and the method hasn't changed
    if (paymentId && !processingPayment) {
      console.log('Payment record already exists, fetching new client secret for changed payment method');
      
      try {
        // If we're switching to Stripe and already have a payment ID, fetch a new client secret
        if (paymentMethod === 'Stripe') {
          await fetchStripeClientSecret(paymentId);
        }
        return; // Skip creating a new payment record
      } catch (error) {
        console.error('Error fetching client secret for existing payment:', error);
      }
    }
    
    try {
      setProcessingPayment(true);
      
      // Extract invoice IDs and ensure they are valid
      const invoiceIds = invoices.map(inv => inv.id).filter(Boolean);
      
      if (invoiceIds.length === 0) {
        throw new Error('No valid invoice IDs available');
      }
      
      console.log('Creating payment record for invoices:', invoiceIds);
      console.log('Using payment method:', paymentMethod);
      
      const payload = { 
        invoiceIds,
        paymentMethod: paymentMethod
      };
      
      console.log('Request payload:', payload);
      
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Server response error:', { 
          status: response.status, 
          statusText: response.statusText,
          data: errorData 
        });
        throw new Error(`Failed to create payment record: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Payment record created successfully:', data);
      setPaymentId(data.paymentId);

      // If Stripe is selected as payment method, fetch client secret
      if (paymentMethod === 'Stripe') {
        await fetchStripeClientSecret(data.paymentId);
      }
    } catch (error) {
      console.error('Error creating payment record:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      toast({
        variant: 'destructive',
        description: error instanceof Error 
          ? `Payment initialization failed: ${error.message}`
          : 'Failed to initialize payment',
      });
    } finally {
      setProcessingPayment(false);
    }
  }, [paymentId, paymentMethod, processingPayment, toast, fetchStripeClientSecret]);

  useEffect(() => {
    // Retrieve selected invoice IDs from session storage
    const selectedIds = sessionStorage.getItem('selectedInvoices');
    
    if (!selectedIds) {
      toast({
        variant: 'destructive',
        description: 'No invoices selected for payment',
      });
      router.push('/user/dashboard/client/invoices');
      return;
    }

    // Only fetch invoices once
    if (hasFetchedInvoices.current) {
      return;
    }
    
    hasFetchedInvoices.current = true;

    const fetchInvoices = async () => {
      try {
        setLoading(true);
        let ids;
        
        try {
          ids = JSON.parse(selectedIds);
          if (!Array.isArray(ids) || ids.length === 0) {
            throw new Error('Invalid invoice selection format');
          }
        } catch (e) {
          console.error('Error parsing selectedInvoices from session storage:', e);
          toast({
            variant: 'destructive',
            description: 'Invalid invoice selection format',
          });
          router.push('/user/dashboard/client/invoices');
          return;
        }
        
        console.log('Fetching invoices with IDs:', ids);
        
        const response = await fetch('/api/invoices/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch invoice details:', { 
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          throw new Error(`Failed to fetch invoice details: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('Server response data:', data);
        
        if (!data.invoices || !Array.isArray(data.invoices)) {
          console.error('Invalid response format. Expected invoices array but got:', data);
          throw new Error('Invalid invoice data format returned from server');
        }
        
        if (data.invoices.length === 0) {
          console.warn('Server returned empty invoices array. This could mean the invoices were already paid or do not exist.');
          toast({
            variant: 'destructive',
            description: 'No invoices found for the selected IDs. They may have been paid already or do not exist.',
          });
          router.push('/user/dashboard/client/invoices');
          return;
        }
        
        console.log(`Successfully fetched ${data.invoices.length} invoices`);
        
        // Validate invoice structure
        const validInvoices = data.invoices.filter((inv: unknown) => 
          inv && typeof inv === 'object' && 
          'id' in inv && 
          'invoiceNumber' in inv && 
          'totalPrice' in inv && typeof inv.totalPrice === 'number'
        ) as SimpleInvoice[];
        
        if (validInvoices.length === 0) {
          console.error('No valid invoices in the response:', data.invoices);
          throw new Error('Invoices missing required fields');
        }
        
        if (validInvoices.length < data.invoices.length) {
          console.warn(`Some invoices (${data.invoices.length - validInvoices.length}) were filtered out due to invalid format`);
        }
        
        // Set invoices in state BEFORE attempting to create payment record
        setInvoices(validInvoices);
        
        // Only after the invoices are fetched and set, attempt to create a payment record
        // Verify we have valid invoice ids before creating the payment
        const invoiceIds = validInvoices.map((inv: SimpleInvoice) => inv.id);
        if (invoiceIds.length > 0) {
          console.log('Creating payment record with valid invoice IDs:', invoiceIds);
          await createPaymentRecord(validInvoices);
        } else {
          console.error('No valid invoice IDs found for payment record creation');
          throw new Error('No valid invoices to process');
        }
      } catch (error) {
        console.error('Error in fetchInvoices:', error);
        toast({
          variant: 'destructive',
          description: error instanceof Error 
            ? error.message 
            : 'Failed to load invoice details',
        });
        router.push('/user/dashboard/client/invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [router, toast, createPaymentRecord]);

  // Add a separate effect for handling payment method changes
  useEffect(() => {
    // We ONLY want to trigger payment record creation when the payment method changes
    // AND we already have invoices AND a previous payment ID
    if (paymentMethod && invoices.length > 0 && paymentId) {
      // No need to create a new payment record, just update payment method on the existing one
      console.log(`Payment method changed to ${paymentMethod} with existing payment ID ${paymentId}`);
      
      // If Stripe is selected, fetch a new client secret for the existing payment
      if (paymentMethod === 'Stripe' && !stripeClientSecret) {
        fetchStripeClientSecret(paymentId).catch(error => {
          console.error('Failed to fetch client secret after payment method change:', error);
        });
      }
    }
  }, [paymentMethod, invoices.length, paymentId, stripeClientSecret, fetchStripeClientSecret]);

  // Stripe components
  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
  );

  const StripeCheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!stripe || !elements || !paymentId) {
        return;
      }
      
      setIsLoading(true);
      
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/user/dashboard/client/payment/${paymentId}/stripe-payment-success`,
        },
      });
      
      if (error) {
        toast({
          variant: 'destructive',
          description: error.message || 'Payment failed',
        });
      }
      
      setIsLoading(false);
    };
    
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        <Button 
          type="submit" 
          className="w-full"
          disabled={!stripe || !elements || isLoading}
        >
          {isLoading ? (
            <Loader className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <CreditCard className="w-4 h-4 mr-2" />
          )}
          Pay with Stripe
        </Button>
      </form>
    );
  };

  // PayPal component
  const PayPalPaymentButton = () => {
    const { toast } = useToast();
    const [{ isPending }] = usePayPalScriptReducer();
    
    if (isPending) {
      return <div className="text-center py-4">Loading PayPal...</div>;
    }
    
    return (
      <PayPalButtons
        createOrder={async () => {
          if (!paymentId) {
            throw new Error('Payment ID not available');
          }
          
          const response = await fetch(`/api/payments/${paymentId}/paypal-create`, {
            method: 'POST',
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            toast({
              variant: 'destructive',
              description: errorData.message || 'Failed to create PayPal order',
            });
            throw new Error('Failed to create PayPal order');
          }
          
          const data = await response.json();
          return data.id;
        }}
        onApprove={async (data) => {
          if (!paymentId) {
            throw new Error('Payment ID not available');
          }
          
          await fetch(`/api/payments/${paymentId}/paypal-capture`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              paymentId: data.orderID 
            }),
          });
          
          toast({
            description: 'Payment completed successfully!',
          });
          
          // Redirect to success page
          router.push(`/user/dashboard/client/payment/${paymentId}`);
        }}
      />
    );
  };

  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/user/dashboard/client/invoices" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Invoices
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Payment Checkout</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Selected Invoices</h2>
              
              <div className="space-y-4">
                {invoices.map(invoice => (
                  <div key={invoice.id} className="border-b pb-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Invoice #{invoice.invoiceNumber}</span>
                      <span className="font-medium">{formatCurrency(invoice.totalPrice)}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      From: {invoice.contractor.name}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
              
              <div className="border-b pb-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Fee</span>
                  <span>{formatCurrency(0)}</span>
                </div>
              </div>
              
              <div className="flex justify-between font-bold text-lg mb-6">
                <span>Total</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={paymentMethod === 'Stripe' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setPaymentMethod('Stripe')}
                  >
                    Stripe
                  </Button>
                  <Button
                    variant={paymentMethod === 'PayPal' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setPaymentMethod('PayPal')}
                  >
                    PayPal
                  </Button>
                </div>
                
                {paymentId && (
                  <>
                    {paymentMethod === 'Stripe' && stripeClientSecret ? (
                      <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                        <StripeCheckoutForm />
                      </Elements>
                    ) : paymentMethod === 'PayPal' ? (
                      <PayPalScriptProvider options={{
                        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb',
                        components: "buttons",
                        currency: "USD"
                      }}>
                        <PayPalPaymentButton />
                      </PayPalScriptProvider>
                    ) : (
                      <div className="text-center py-4">
                        Loading payment options...
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
