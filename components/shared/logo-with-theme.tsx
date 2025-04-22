'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';

interface LogoWithThemeProps {
  width?: number;
  height?: number;
  alt?: string;
  priority?: boolean;
}

const LogoWithTheme: React.FC<LogoWithThemeProps> = ({
  width = 36,
  height = 36,
  alt = 'Logo',
  priority = false,
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <Link href="/" className="flex-center">
      <Image
        src="/images/logo.svg"
        width={width}
        height={height}
        alt={alt}
        priority={priority}
        className={isDarkMode ? 'filter invert' : ''}
        style={{ filter: isDarkMode ? 'invert(1)' : 'none' }}
      />
    </Link>
  );
};

export default LogoWithTheme; 
