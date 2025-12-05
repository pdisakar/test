import React from 'react';
import { fetchAllTestimonials } from '@/lib/api';
import { TestimonialCard } from '@/components/Cards/TestimonialCard/TestimonialCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Customer Testimonials | What Our Travelers Say',
    description: 'Read authentic reviews and testimonials from our satisfied customers who have experienced unforgettable journeys with us.',
    keywords: 'testimonials, customer reviews, travel reviews, client feedback, tour reviews',
};

export default async function TestimonialsPage() {
    const testimonials = await fetchAllTestimonials();

    return (
        <main className="testimonials-page">
            <section className="testimonials-grid-section common-box">
                <div className="container mx-auto px-4">
                    {testimonials.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {testimonials.map((testimonial) => (
                                <TestimonialCard key={testimonial.id} data={testimonial} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="max-w-md mx-auto">
                                <svg
                                    className="mx-auto h-24 w-24 text-primary/20 mb-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                    />
                                </svg>
                                <h3 className="text-2xl font-semibold text-headings mb-2">
                                    No Testimonials Yet
                                </h3>
                                <p className="text-body-text/70">
                                    We're collecting feedback from our travelers. Check back soon!
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
