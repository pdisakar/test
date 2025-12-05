import React from 'react';
import { Testimonial } from '@/lib/api';
import Image from 'next/image';
import { IMAGE_URL } from '@/lib/constants';

interface TestimonialCardProps {
    data: Testimonial;
}

export const TestimonialCard = ({ data }: TestimonialCardProps) => {
    console.log(data);

    return (
        <>
            review</>
    );
};
