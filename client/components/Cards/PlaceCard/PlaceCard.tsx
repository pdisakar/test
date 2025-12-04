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


        <Link href={`/${data.slug}`}>
            <figure className='image-slot aspect-320/350'>
                <Image
                    src={data.featuredImage ? `${IMAGE_URL}${data.featuredImage}` : '/placeholder.jpg'}
                    alt={data.featuredImageAlt || data.title}
                    fill
                    priority
                />
            </figure>
        </Link>

    );
};
