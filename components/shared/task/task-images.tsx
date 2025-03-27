'use client';

/**
 * @module TaskImages
 * @description A component that displays a gallery of task-related images with a main image
 * and thumbnails for navigation. Users can click on thumbnails to view different images.
 */

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useState } from 'react';

/**
 * TaskImages component for displaying a gallery of images with interactive thumbnails.
 * Shows a main large image and smaller thumbnail images below for navigation.
 * 
 * @param {Object} props - Component props
 * @param {string[]} props.images - Array of image URLs to display in the gallery
 * @returns {JSX.Element} An image gallery with main image and clickable thumbnails
 */
const TaskImages = ({ images }: { images: string[] }) => {
  /**
   * State to track the index of the currently displayed main image
   */
  const [current, setCurrent] = useState(0);

  return (
    <div className='space-y-4'>
      <Image
        src={images![current]}
        alt='hero image'
        width={1000}
        height={1000}
        className='min-h-[300px] object-cover object-center '
      />
      <div className='flex'>
        {images.map((image, index) => (
          <div
            key={image}
            className={cn(
              'border   mr-2 cursor-pointer hover:border-orange-600',
              current === index && '  border-orange-500'
            )}
            onClick={() => setCurrent(index)}
          >
            <Image src={image} alt={'image'} width={100} height={100} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskImages;
