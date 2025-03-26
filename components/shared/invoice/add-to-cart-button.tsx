'use client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Invoice } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { addInvoiceToCart } from '@/lib/actions/cart.actions';
import { useTransition } from 'react';
import { Loader2, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';

const AddToCartButton = ({ 
  invoice
}: { 
  invoice: Invoice;
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isInCart, setIsInCart] = useState(false);
  
  // Check if invoice is in cart when component mounts
  useEffect(() => {
    const checkCartStatus = async () => {
      try {
        const response = await fetch('/api/cart');
        if (response.ok) {
          const cart = await response.json();
          const found = cart.invoices?.some((item: any) => item.id === invoice.id);
          setIsInCart(found || false);
        }
      } catch (error) {
        console.error('Error checking cart status:', error);
      }
    };
    
    checkCartStatus();
  }, [invoice.id]);

  const handleAddToCart = () => {
    startTransition(async () => {
      const res = await addInvoiceToCart(invoice.id);

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        });
        return;
      }
      
      setIsInCart(true);

      toast({
        description: "Invoice added to cart",
        action: (
          <ToastAction
            className='bg-primary text-white hover:bg-gray-800'
            altText='Go To Cart'
            onClick={() => router.push('/user/dashboard/client/cart')}
          >
            Go To Cart
          </ToastAction>
        ),
      });
    });
  };

  if (isInCart) {
    return (
      <Button
        variant="secondary"
        onClick={() => router.push('/user/dashboard/client/cart')}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        View in Cart
      </Button>
    );
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isPending}
      className="bg-green-500 hover:bg-green-600 text-white"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <ShoppingCart className="h-4 w-4 mr-2" />
      )}
      Add to Cart
    </Button>
  );
};

export default AddToCartButton; 
