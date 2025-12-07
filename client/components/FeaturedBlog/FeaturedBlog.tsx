import { fetchFeaturedBlogs } from '@/lib/api';
import React from 'react'
import { BlogCard } from '@/components/Cards/BlogCard/BlogCard';

interface FeaturedBlogProps {
    pretitle?: string;
    title?: string;
    subtitle?: string;
}

export default async function FeaturedBlog({ pretitle, title, subtitle }: FeaturedBlogProps) {
    const Blogs = await fetchFeaturedBlogs();

    return (
        <section className='featured-blog common-box pt-0'>
            <div className="container">
                <div className="title">
                    {pretitle && <span className='justify-start!'>
                        <svg
                            className="icon text-primary"
                            width="36"
                            height="26.4"
                        >
                            <use
                                xlinkHref="/icons.svg#company-logo"
                                fill="currentColor"
                            ></use>
                        </svg>
                        {pretitle}</span>}
                    {title && <h2 className='text-left!' dangerouslySetInnerHTML={{ __html: title }} />}
                    {subtitle && <p className='text-left! ml-0!' dangerouslySetInnerHTML={{ __html: subtitle }} />}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
                    {Blogs.slice(0, 4).map((blog) => (
                        <BlogCard key={blog.id} blog={blog} />
                    ))}
                </div>
            </div>
        </section>
    )
}
