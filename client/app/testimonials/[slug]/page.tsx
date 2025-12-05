import React from 'react';
import { fetchTestimonialBySlug } from '@/lib/api';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { IMAGE_URL } from '@/lib/constants';
import Link from 'next/link';
import type { Metadata } from 'next';

// Generate dynamic metadata
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const resolvedParams = await Promise.resolve(params);
    const slug = resolvedParams?.slug;
    
    if (!slug) return { title: 'Testimonial Not Found' };

    const testimonial = await fetchTestimonialBySlug(slug);
    if (!testimonial) return {
        title: 'Testimonial Not Found'
    };
    
    return {
        title: `${testimonial.reviewTitle} | Customer Review`,
        description: testimonial.description ? testimonial.description.replace(/<[^>]*>?/gm, '').substring(0, 160) : 'Customer testimonial',
    };
}

export default async function TestimonialDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await Promise.resolve(params);
    const slug = resolvedParams?.slug;
    
    const testimonial = await fetchTestimonialBySlug(slug);

    if (!testimonial) {
        notFound();
    }

    return (
        <main className="testimonial-detail-page py-12 md:py-20 bg-gray-50/50 min-h-[60vh]">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <div className="mb-8">
                        <Link
                            href="/testimonials"
                            className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors duration-300 group"
                        >
                            <svg
                                className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Testimonials
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 overflow-hidden relative">
                        {/* Decorative Quote Mark */}
                        <div className="absolute top-6 right-8 text-primary/5 pointer-events-none select-none">
                            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 7.55228 14.017 7V3H19.017C20.6739 3 22.017 4.34315 22.017 6V15C22.017 16.6569 20.6739 18 19.017 18H16.017V21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 7.55228 5.0166 7V3H10.0166C11.6735 3 13.0166 4.34315 13.0166 6V15C13.0166 16.6569 11.6735 18 10.0166 18H7.0166V21H5.0166Z" />
                            </svg>
                        </div>

                        {/* Header: User Info & Rating */}
                        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center border-b border-gray-100 pb-8 mb-8">
                            <div className="flex-shrink-0">
                                {testimonial.avatar ? (
                                    <figure className="relative h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden border-2 border-white shadow-md">
                                        <Image
                                            src={IMAGE_URL + testimonial.avatar}
                                            alt={testimonial.fullName}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 80px, 96px"
                                        />
                                    </figure>
                                ) : (
                                    <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold border-2 border-white shadow-md">
                                        {testimonial.fullName?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-headings capitalize mb-2">
                                    {testimonial.reviewTitle}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1 text-primary">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <svg
                                                    key={i}
                                                    className={`w-5 h-5 ${i < (testimonial.rating || 5) ? 'fill-current' : 'text-gray-300 fill-current'}`}
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                        <span className="font-semibold ml-1">{testimonial.rating}.0</span>
                                    </div>
                                    <span className="text-gray-300">|</span>
                                    <div className="flex flex-col md:flex-row md:gap-4">
                                        <span className="font-medium text-headings">{testimonial.fullName}</span>
                                        {testimonial.address && (
                                            <span className="text-muted hidden md:inline">• {testimonial.address}</span>
                                        )}
                                    </div>
                                </div>
                                {testimonial.address && (
                                    <div className="text-muted text-sm mt-1 md:hidden">
                                        {testimonial.address}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="relative z-10 prose prose-lg prose-headings:text-headings prose-p:text-body-text max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: testimonial.description || '' }} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
