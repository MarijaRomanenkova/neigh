import Header from "@/components/shared/header";
import Footer from "@/components/footer";
import { getAllCategories } from '@/lib/actions/task.actions';
import { Category } from '@/types';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getAllCategories();

  return (
    <div className="flex h-screen flex-col">
      <Header categories={categories as unknown as Category[]} />
      <main className="main flex-1 wrapper">{children}</main>
      <Footer />
      
    </div>
  );
}
