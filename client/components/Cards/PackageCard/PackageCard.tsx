import Link from 'next/link';
import React from 'react';
import { Package } from '@/lib/api';
import Image from 'next/image';
import { IMAGE_URL } from '@/lib/constants';
import PackageButton from '@/components/Buttons/PackageButton/PackageButton';
interface PackageCardProps {
  data: Package;
}

export const PackageCard = ({ data }: PackageCardProps) => {

  return (
    <div className='card group shadow-custom-shadow rounded-lg border border-primary/5'>
      <figure className='image-slot aspect-[420/350] rounded-t-lg'>
        <Link href={`/${data.slug}`} className='group'>
          <Image
            src={data.featuredImage ? `${IMAGE_URL}${data.featuredImage}` : '/placeholder.jpg'}
            alt={data.featuredImageAlt || data.title}
            fill
            priority
            className='rounded-lg transition-all duration-500 ease-out group-hover:scale-110 group-hover:blur-[0.5px]'
          />
        </Link>
      </figure>
      <figcaption className=' '>
        <div className="top-section p-4 md:p-6">
          <div className="package_rating flex items-center gap-1 mb-[5px]">
            <svg
              className="icon text-primary"
              width="82"
              height="14"
            >
              <use
                xlinkHref="/icons.svg#5_star"
                fill="currentColor"
              ></use>
            </svg>
            {Number(data?.total_testimonials) > 0 && (
              <span className="text-sm leading-[100%] text-muted font-light">
                ({String(data.total_testimonials).padStart(2, '0')})
              </span>
            )}
          </div>
          <Link href={`/${data.slug}`} className='group'>
            <h3 className='text-headings text-[22px] leading-[1.29] font-semibold capitalize transition-all duration-200 ease-out group-hover:text-primary'>{data.title}</h3>
          </Link>
          <div className="duration flex items-center gap-1 mt-[10px]">
            <svg
              className="icon text-muted"
              width="15"
              height="15"
            >
              <use
                xlinkHref="/icons.svg#package_card_duration"
                fill="currentColor"
              ></use>
            </svg>
            <span className="text-muted font-medium">
              {data.durationUnit === "days" ? (
                <span className="text-sm leading-[100%]">
                  {data.duration} Days {data.duration + 1} Nights
                </span>
              ) : (
                <span className="text-sm leading-[100%]">
                  {data.duration} {data.durationUnit}
                </span>
              )}

            </span>
          </div>
        </div>
        <div className="bottom-section flex items-center justify-between gap-4 flex-wrap px-4 py-4 md:px-6 md:py-5 border-t border-primary/15">
          <div className="cost">
            <span className="text-xs block font-semibold text-headings tracking-[0.5px]">Starting From</span>
            <span className="text-lg lg:text-2xl block font-black text-primary tracking-[0.5px]">UD$ {data.defaultPrice}</span>
          </div>
          <PackageButton href={`/${data.slug}`} label="View Details" />
        </div>

      </figcaption>
    </div>
  );
};
