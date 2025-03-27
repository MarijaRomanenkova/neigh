/**
 * Root Layout Component
 * @module Layouts
 * @group Root Layout
 * 
 * This layout component provides the main application structure for all pages
 * in the root route group, including header, main content area, and footer.
 * It fetches categories for the navigation menu and maintains a consistent
 * layout across all root pages.
 */

import Header from "@/components/shared/header";
import Footer from "@/components/footer";
import { getAllCategories } from '@/lib/actions/task.actions';
import { Category } from '@/types';

/**
 * Root Layout Component
 * 
 * This server component renders the main application layout structure with:
 * - Header with navigation and category menu
 * - Main content area for child components
 * - Footer with site information
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render in the main content area
 * @returns {JSX.Element} Complete page layout with header, content, and footer
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch all categories for the navigation menu
  const categories = await getAllCategories();

  return (
    <div className="flex h-screen flex-col">
      <Header categories={categories as unknown as Category[]} />
      <main className="main flex-1 wrapper">{children}</main>
      <Footer />
      
    </div>
  );
}
