import React from 'react';
import { fetchTestimonials } from '@/lib/api';
import { TestimonialsList } from '@/components/TestimonialsList/TestimonialsList';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Customer Testimonials | What Our Travelers Say',
    description: 'Read authentic reviews and testimonials from our satisfied customers who have experienced unforgettable journeys with us.',
    keywords: 'testimonials, customer reviews, travel reviews, client feedback, tour reviews',
};

export default async function TestimonialsPage() {
    const { data: testimonials, total } = await fetchTestimonials(1, 6);
    

    return (
        <main className="testimonials-page">
            <section className="testimonials-grid-section common-box">
                <div className="container mx-auto px-4">
                    <TestimonialsList initialTestimonials={testimonials} totalCount={total} />
                </div>
            </section>
        </main>
    );
}
