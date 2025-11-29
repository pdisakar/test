'use client';

import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { Button } from '@/components/Button';
import { Calendar, User, ArrowLeft, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Blog {
    id: number;
    title: string;
    slug: string;
    abstract: string;
    description: string;
    publishedDate: string;
    featuredImage: string;
    bannerImage: string;
    authorId: number;
}

export default function BlogDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/blogs/${params.slug}`);
                const data = await response.json();
                if (data.success) {
                    setBlog(data.blog);
                }
            } catch (error) {
                console.error('Error fetching blog:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.slug) {
            fetchBlog();
        }
    }, [params.slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <PublicHeader />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
                <PublicFooter />
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <PublicHeader />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog Not Found</h1>
                    <Button onClick={() => router.push('/blogs')}>Back to Blogs</Button>
                </div>
                <PublicFooter />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <PublicHeader />

            <main className="flex-1">
                {/* Banner */}
                <div className="relative h-[500px]">
                    <div className="absolute inset-0 bg-gray-900/60 z-10"></div>
                    <img
                        src={blog.bannerImage || blog.featuredImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2021&q=80'}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Content */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-20">
                    <article className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
                        {/* Meta */}
                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                            <button
                                onClick={() => router.push('/blogs')}
                                className="flex items-center gap-2 text-primary hover:underline"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Blogs
                            </button>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(blog.publishedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>5 min read</span>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                            {blog.title}
                        </h1>

                        {/* Author */}
                        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">Travel Writer</div>
                                <div className="text-sm text-gray-500">Expert Traveler</div>
                            </div>
                        </div>

                        {/* Abstract */}
                        {blog.abstract && (
                            <div className="bg-gray-50 rounded-xl p-6 mb-8 border-l-4 border-primary">
                                <p className="text-lg text-gray-700 italic leading-relaxed">
                                    {blog.abstract}
                                </p>
                            </div>
                        )}

                        {/* Content */}
                        <div className="prose prose-lg max-w-none">
                            <div
                                className="text-gray-700 leading-relaxed whitespace-pre-line"
                                dangerouslySetInnerHTML={{ __html: blog.description || 'Blog content will appear here.' }}
                            />
                        </div>

                        {/* Share & CTA */}
                        <div className="mt-12 pt-8 border-t border-gray-100">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-500">
                                    Was this article helpful?
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline">
                                        Share Article
                                    </Button>
                                    <Button className="bg-primary hover:bg-primary/90">
                                        Explore Packages
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </article>

                    {/* Related Blogs Section (Placeholder) */}
                    <div className="mt-16 mb-16">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Stories</h2>
                        <div className="text-center py-12 text-gray-500">
                            More stories coming soon...
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
