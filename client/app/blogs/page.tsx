'use client';


import Link from 'next/link';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchAllBlogs, Blog } from '@/lib/api';

// Blog interface is imported from lib/api.ts

export default function BlogsPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const data = await fetchAllBlogs();
                setBlogs(data);
            } catch (error) {
                console.error('Error fetching blogs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    return (
        <div className="min-h-screen bg-white flex flex-col">
          


            <main className="flex-1">
                {/* Header */}
                <div className="bg-gray-50 py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Travel Journal</h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Stories, tips, and guides to inspire your next adventure.
                        </p>
                    </div>
                </div>

                {/* Blogs Grid */}
                <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-gray-100 rounded-2xl h-[300px] animate-pulse"></div>
                            ))}
                        </div>
                    ) : blogs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {blogs.map((blog) => (
                                <div key={blog.id} className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                                    <div className="relative h-56 overflow-hidden">
                                        <img
                                            src={blog.featuredImage || 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                                            alt={blog.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>{new Date(blog.publishedDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                <span>Admin</span>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                                            {blog.title}
                                        </h3>
                                        <p className="text-gray-600 line-clamp-3 mb-4 text-sm flex-1">
                                            {blog.abstract}
                                        </p>
                                        <Link href={`/${blog.slug}`} className="inline-flex items-center text-primary font-medium hover:underline mt-auto">
                                            Read Full Story <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No blogs found</h3>
                            <p className="text-gray-600">Check back later for new stories.</p>
                        </div>
                    )}
                </div>
            </main>

    
        </div>
    );
}
