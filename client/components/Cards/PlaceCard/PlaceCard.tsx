import { Place } from '@/lib/api';
import { IMAGE_URL } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface PlaceCardProps {
    data: Place;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ data }) => {
    return (
        <Link href={`/${data.slug}`} className='relative rounded-lg group'>
            <figure className='image-slot aspect-320/420 rounded-lg'>
                <Image
                    src={data.featuredImage ? `${IMAGE_URL}${data.featuredImage}` : '/placeholder.jpg'}
                    alt={data.featuredImageAlt || data.title}
                    fill
                    priority
                    className='rounded-lg transition-all duration-500 ease-out group-hover:scale-110 group-hover:blur-[1px]'
                />
            </figure>
            <figcaption className=' absolute left-0 right-0 bottom-0 z-10 text-white px-6 py-4 bg-linear-to-t from-black/70 to-transparent rounded-b-lg'>
                <h2 className="text-[22px] font-semibold transform transition-all text-shadow-md duration-300 translate-y-4 opacity-100 group-hover:-translate-y-2">
                    {data.title}
                </h2>
                <p className="text-sm font-light transform transition-all text-shadow-sm duration-300 translate-y-4 opacity-0 group-hover:-translate-y-2 group-hover:opacity-100">
                    {String(data.packageCount).padStart(2, "0")} Packages
                </p>
            </figcaption>
        </Link>

    );
};
