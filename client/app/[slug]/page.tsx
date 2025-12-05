import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { fetchSlugData } from '@/lib/api';
import { Places } from '@/components/Pages/Places/Places';
import { Package } from '@/components/Pages/Package/Package';
import { Article } from '@/components/Pages/Article/Article';
import { Blog } from '@/components/Pages/Blog/Blog';

interface PageProps {
    params: Promise<{ slug: string }>;
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
