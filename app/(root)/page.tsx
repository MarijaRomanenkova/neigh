import ProductList from '@/components/shared/product/product-list';
import { getLatestProducts } from '@/lib/actions/product.actions';
const HomePage = async () => {
  const latestProducts = await getLatestProducts();

  // Convert rating to number
  const formattedProducts = latestProducts.map(product => ({
    ...product,
    rating: Number(product.rating), // Convert rating to number
  }));

  return ( 
    <div className='space-y-8'>
      <h2 className='h2-bold'>Latest Products</h2>
      <ProductList title='Newest Arrivals' data={formattedProducts} limit={4} />
    </div>
  );
};

export default HomePage;
