import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Quote, Star } from 'lucide-react';
import { fetchFeaturedTestimonials, Testimonial } from '@/lib/api';
import { Button } from '@/components/Button';

export const FeaturedTestimonials: React.FC = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await fetchFeaturedTestimonials();
            setTestimonials(data);
            setLoading(false);
        };
        load();
    }, []);

    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">What Travelers Say</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Hear from our happy travelers who have explored the world with us.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="bg-gray-100 rounded-2xl h-[300px] animate-pulse" />
                    ))
                ) : testimonials.length > 0 ? (
                    testimonials.map(testimonial => (
                        <div key={testimonial.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative">
                            <Quote className="h-10 w-10 text-primary/20 absolute top-6 right-6" />
                            <div className="flex items-center gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                    />
                                ))}
                            </div>
                            <div
                                className="text-gray-700 mb-6 line-clamp-4 prose prose-sm"
                                dangerouslySetInnerHTML={{ __html: testimonial.description }}
                            />
                            <div className="flex items-center gap-4 mt-auto">
                                <img
                                    src={testimonial.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.fullName)}`}
                                    alt={testimonial.fullName}
                                    className="h-12 w-12 rounded-full object-cover"
                                />
                                <div>
                                    <h4 className="font-bold text-gray-900">{testimonial.fullName}</h4>
                                    <p className="text-sm text-gray-500">{testimonial.address}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-3 text-center py-12 text-gray-500">No featured testimonials available.</div>
                )}
            </div>
        </section>
    );
};
