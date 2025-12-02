'use client';

import React, { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { fetchSlugData } from '@/lib/api';
import { Places } from '@/components/Pages/Places/Places';
import { Package } from '@/components/Pages/Package/Package';
import { Article } from '@/components/Pages/Article/Article';
import { Blog } from '@/components/Pages/Blog/Blog';



export default function DynamicPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [data, setData] = useState<{ datatype: string; content: any } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await fetchSlugData(slug);
                if (!result) {
                    setError(true);
                } else {
                    setData(result);
                }
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchData();
        }
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !data) {
        return notFound();
    }
    console.log(data);


    return (
        <>

            <main className="">
                {data.datatype === 'place' && <Places content={data.content} />}
                {data.datatype === 'package' && <Package content={data.content} />}
                {data.datatype === 'article' && <Article content={data.content} />}
                {data.datatype === 'blog' && <Blog content={data.content} />}
            </main>

        </>
    );
}
