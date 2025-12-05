import React from 'react';
import { Testimonial } from '@/lib/api';
import Image from 'next/image';
import { IMAGE_URL } from '@/lib/constants';
import Link from 'next/link';

interface TestimonialCardProps {
    data: Testimonial;
}

export const TestimonialCard = ({ data }: TestimonialCardProps) => {
    console.log(data);

    return (
        <div className='testimonial-card shadow-custom-shadow rounded-lg border border-primary/5 '>
            <div className="top-section p-4 md:p-6">
                <div className="header-section">
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
                    <h2 className=' text-lg font-semibold text-headings mt-1 line-clamp-1 capitalize'>{data.reviewTitle}</h2>
                </div>
                <article className=' text-body-text/80 leading-[150%] mt-2 line-clamp-4' dangerouslySetInnerHTML={{ __html: data.description || '' }} />
                <Link href={`/testimonials/${data.slug}`} className='text-primary mt-2 text-sm font-medium'>Read more +</Link>
            </div>

            <div className="bottom-section flex items-center justify-between gap-4 flex-wrap px-4 py-4 md:px-6 md:py-5 border-t border-primary/15">
                <div className="customer-about flex items-center gap-2">

                    {data?.avatar ? (
                        <figure className="rounded-full w-[50px] h-[50px] overflow-hidden">
                            <Image
                                src={IMAGE_URL + data.avatar}
                                alt={data.fullName}
                                className="object-cover rounded-full"
                                height={50}
                                width={50}
                                sizes="50px"
                            />
                        </figure>
                    ) : (
                        <div className="w-[50px] h-[50px] rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-semibold">
                            {data?.fullName?.charAt(0).toUpperCase()}
                        </div>
                    )}

                    <div className="customer-info">
                        <h3 className='text-headings font-medium leading-[100%] capitalize'>
                            {data.fullName}
                        </h3>
                        <p className='text-muted text-sm font-medium leading-[100%] mt-1.5'>
                            {data.address}
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};
