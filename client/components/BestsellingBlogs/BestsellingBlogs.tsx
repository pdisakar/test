import Link from 'next/link';
import Image from 'next/image';
import { fetchBestsellingBlogs, Blog } from '@/lib/api';
import { IMAGE_URL } from '@/lib/constants';

export default async function BestsellingBlogs() {
    const blogs: Blog[] = await fetchBestsellingBlogs();

    if (blogs.length === 0) return null;

    return (
        <section className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold mb-8">Bestselling Blogs</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {blogs.map(blog => (
                        <Link
                            key={blog.id}
                            href={`/${blog.slug}`}
                            className="group block rounded-xl overflow-hidden bg-white shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <div className="relative h-48 w-full">
                                <Image
                                    src={blog.featuredImage ? `${IMAGE_URL}${blog.featuredImage}` : '/placeholder.jpg'}
                                    alt={blog.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform"
                                />
                            </div>
                            <div className="p-4">
                                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                    {blog.title}
                                </h3>
                                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                    {blog.abstract}
                                </p>
                                <p className="mt-2 text-xs text-gray-500">
                                    {new Date(blog.publishedDate).toLocaleDateString()}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
