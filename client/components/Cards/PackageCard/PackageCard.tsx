import Link from 'next/link';
import React from 'react';
import { Package } from '@/lib/api';
import Image from 'next/image';
import { IMAGE_URL } from '@/lib/constants';
interface PackageCardProps {
  data: Package;
}

export const PackageCard = ({ data }: PackageCardProps) => {
  console.log(data);

  return (
    <>
      <figure className='image-slot aspect-[420/350]'>
        <Link href={`/${data.slug}`} className='group'>
          <Image
            src={data.featuredImage ? `${IMAGE_URL}${data.featuredImage}` : '/placeholder.jpg'}
            alt={data.featuredImageAlt || data.title}
            fill
            priority
            className='rounded-lg transition-all duration-500 ease-out group-hover:scale-110 group-hover:blur-[1px]'
          />
        </Link>
      </figure>
      <figcaption>
        <Link href={`/${data.slug}`} className='group'>
          <h3 className='text-headings text-[22px] font-semibold capitalize'>{data.title}</h3>
        </Link>
      </figcaption>
    </>
  );
};
