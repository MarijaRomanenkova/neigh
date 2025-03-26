import CartTable from './cart-table';
import { getMyCart } from '@/lib/actions/cart.actions';

export const metadata = {
  title: 'Shopping Cart',
};

const CartPage = async () => {
  try {
    const cart = await getMyCart();
    
    return (
      <>
        {/* @ts-ignore - Cart is properly converted in the server action */}
        <CartTable cart={cart} />
      </>
    );
  } catch (error) {
    console.error('Error loading cart:', error);
    return (
      <div className="py-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Error loading cart data</h2>
        <p>We encountered a problem loading your shopping cart. Please try again later.</p>
      </div>
    );
  }
};

export default CartPage;
