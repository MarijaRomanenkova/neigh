'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';
import { LayoutDashboard, ScrollText, ClipboardList, FileCheck, Send, Download } from 'lucide-react';

// Define navigation links with icons
const links = [
  {
    title: 'Dashboard',
    href: '/user/dashboard',
    icon: <LayoutDashboard className="h-4 w-4 mr-2" />
  },
  {
    title: 'My Tasks',
    href: '/user/dashboard/client/tasks',
    icon: <ClipboardList className="h-4 w-4 mr-2" />
  },
  {
    title: 'Received Invoices',
    href: '/user/dashboard/client/invoices',
    icon: <Download className="h-4 w-4 mr-2" />
  },
  {
    title: 'Issued Invoices',
    href: '/user/dashboard/contractor/invoices',
    icon: <Send className="h-4 w-4 mr-2" />
  },
  {
    title: 'Assignments',
    href: '/user/dashboard/contractor/assignments',
    icon: <FileCheck className="h-4 w-4 mr-2" />
  }
];

const MainNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  const pathname = usePathname();
  
  return (
    <nav
      className={cn('flex items-center space-x-4 lg:space-x-6', className)}
      {...props}
    >
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary flex items-center',
            pathname.includes(item.href) 
              ? 'text-primary' 
              : 'text-muted-foreground'
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  );
};

export default MainNav;
