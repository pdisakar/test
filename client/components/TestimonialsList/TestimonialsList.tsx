'use client';

import React, { useState } from 'react';
import { Testimonial, fetchTestimonials } from '@/lib/api';
import { TestimonialCard } from '@/components/Cards/TestimonialCard/TestimonialCard';

interface TestimonialsListProps {
    initialTestimonials: Testimonial[];
    totalCount: number;
}

export const TestimonialsList = ({ initialTestimonials, totalCount }: TestimonialsListProps) => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
    const [loading, setLoading] = useState(false);
    const [nextPage, setNextPage] = useState(2);
    
    const hasMore = testimonials.length < totalCount;
    
    const loadMore = async () => {
        if (loading || !hasMore) return;
        
        setLoading(true);
        try {
            const { data } = await fetchTestimonials(nextPage, 6);
            
            if (data.length > 0) {
                setTestimonials(prev => [...prev, ...data]);
                setNextPage(prev => prev + 1);
            }
        } catch (error) {
            console.error('Failed to load more testimonials:', error);
        } finally {
            setLoading(false);
        }
    };

    if (testimonials.length === 0) {
        return (
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
        );
    }

    return (
        <div className="testimonials-grid-wrapper">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {testimonials.map((testimonial) => (
                    <TestimonialCard key={testimonial.id} data={testimonial} />
                ))}
            </div>
            
            {hasMore && (
                <div className="text-center mt-12">
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className="group inline-flex items-center gap-2 bg-transparent border border-primary text-primary px-6 py-2.5 rounded-full font-medium text-sm hover:bg-primary hover:text-white transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary group-hover:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Loading...</span>
                            </>
                        ) : (
                            <>
                                <span>Load More</span>
                                <svg
                                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </>
                        )}
                    </button>
                    <p className="text-body-text/50 text-xs mt-3 font-medium">
                        Showing {testimonials.length} of {totalCount} testimonials
                    </p>
                </div>
            )}
        </div>
    );
};
