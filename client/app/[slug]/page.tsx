import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { fetchSlugData, fetchAllSlugs } from '@/lib/api';
import { Places } from '@/components/Pages/Places/Places';
import { Package } from '@/components/Pages/Package/Package';
import { Article } from '@/components/Pages/Article/Article';
import { Blog } from '@/components/Pages/Blog/Blog';

interface PageProps {
    params: Promise<{ slug: string }>;
}

// Generate static params for important pages (ISR - Incremental Static Regeneration)
export async function generateStaticParams() {
    try {
        const data = await fetchAllSlugs();

        if (!Array.isArray(data)) {
            return [];
        }

        // Excluded slugs - pages that have their own routes
        const excludedSlugs = [
            'blog', 'blogs', 'contact', 'contact-us', 'about', 'about-us',
            'packages', 'places', 'articles', 'team', 'teams', 'admin', 'admin/dashboard'
        ];

        // Filter and prioritize featured content, limit to top 50 for faster builds
        return data
            .filter(({ slug }) => !excludedSlugs.includes(slug))
            .map(({ slug }) => ({ slug }));
    } catch (error) {
        console.error('Error in generateStaticParams:', error);
        return [];
    }
}

// Generate metadata
export async function generateMetadata(props: PageProps): Promise<Metadata> {
    const params = await props.params;
    const data = await fetchSlugData(params.slug);

    if (!data || !data.content) {
        notFound();
    }

    const { content } = data;
    const meta = content.meta || {};

    return {
        title: meta.title,
        description: meta.description,
        alternates: {
            canonical: `${process.env.NEXT_PUBLIC_CANONICAL_BASE}/${params.slug}`,
        },
        openGraph: {
            title: meta.title,
            description: meta.description,
        },
    };
}

export default async function DynamicPage(props: PageProps) {
    const params = await props.params;
    const data = await fetchSlugData(params.slug);

    if (!data || !data.content) {
        notFound();
    }

    return (
        <main>
            {data.datatype === 'place' && <Places content={data.content} />}
            {data.datatype === 'package' && <Package content={data.content} />}
            {data.datatype === 'article' && <Article content={data.content} />}
            {data.datatype === 'blog' && <Blog content={data.content} />}
        </main>
    );
}
