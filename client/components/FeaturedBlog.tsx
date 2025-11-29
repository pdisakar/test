import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Star } from 'lucide-react';
import { fetchFeaturedBlogs, Blog } from '@/lib/api';
import { Button } from '@/components/Button';

export const FeaturedBlog: React.FC = () => {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await fetchFeaturedBlogs();
            setBlogs(data);
            setLoading(false);
        };
        load();
    }, []);

    return (
        <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Stories</h2>
                        <p className="text-gray-600 max-w-2xl">
                            Inspiring travel stories and guides from our featured collection.
                        </p>
                    </div>
                    <Link href="/blogs" className="hidden md:flex items-center text-primary font-medium hover:underline">
                        Read all stories <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="bg-gray-100 rounded-2xl h-[300px] animate-pulse" />
                        ))
                    ) : blogs.length > 0 ? (
                        blogs.map(blog => (
                            <div key={blog.id} className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                                <div className="relative h-56 overflow-hidden">
                                    <img
                                        src={blog.featuredImage || 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                                        alt={blog.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="text-sm text-primary font-medium mb-2">
                                        {new Date(blog.publishedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                                        {blog.title}
                                    </h3>
                                    <p className="text-gray-600 line-clamp-2 mb-4 flex-1">
                                        {blog.abstract}
                                    </p>
                                    <Link href={`/${blog.slug}`} className="inline-flex items-center text-gray-900 font-medium hover:text-primary transition-colors mt-auto">
                                        Read More <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-3 text-center py-12 text-gray-500">No featured blogs available.</div>
                    )}
                </div>
            </div>
        </section>
    );
};
