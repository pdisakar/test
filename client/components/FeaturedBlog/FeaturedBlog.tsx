import { fetchFeaturedBlogs } from '@/lib/api';
import React from 'react'

interface FeaturedBlogProps {
    pretitle?: string;
    title?: string;
    subtitle?: string;
}

export default async function FeaturedBlog({ pretitle, title, subtitle }: FeaturedBlogProps) {
    const Blogs = await fetchFeaturedBlogs();
    console.log(Blogs);
    
    return (
        <div>FeaturedBlog</div>
    )
}
