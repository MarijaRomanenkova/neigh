'use client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Cart, Invoice } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { addInvoiceToCart, removeInvoiceFromCart } from '@/lib/actions/cart.actions';
import { useTransition } from 'react';
import { Check, Loader2, Plus } from 'lucide-react';

const AddToCart = ({ 
  cart, 
  invoice,
  variant = "outline",
  size = "default"
}: { 
  cart?: Cart; 
  invoice: Invoice;
  variant?: "outline" | "ghost";
  size?: "default" | "icon";
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const isInCart = cart?.invoices.find((i) => i.id === invoice.id);

  const handleAddToCart = async () => {
    startTransition(async () => {
      const res = await addInvoiceToCart(invoice.id);

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        });
        return;
      }

      toast({
        description: res.message,
        action: (
          <ToastAction
            className='bg-primary text-white hover:bg-gray-800'
            altText='Go To Cart'
            onClick={() => router.push('/cart')}
          >
            Go To Cart
          </ToastAction>
        ),
      });
    });
  };

  const handleRemoveFromCart = async () => {
    startTransition(async () => {
      const res = await removeInvoiceFromCart(invoice.id);
      toast({
        variant: res.success ? 'default' : 'destructive',
        description: res.message,
      });
    });
  };

  return (
    <Button
      onClick={isInCart ? handleRemoveFromCart : handleAddToCart}
      disabled={isPending}
      variant={variant}
      size={size}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isInCart ? (
        <Check className="h-4 w-4" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
    </Button>
  );
};

export default AddToCart;
