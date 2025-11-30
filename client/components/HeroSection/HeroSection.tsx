'use client';

import React, { useEffect, useState } from 'react';
import { fetchHeroSection, HeroSectionData } from '@/lib/api';
import { IMAGE_URL } from '@/lib/constants';
import Image from 'next/image';

export function HeroSection() {
    const [heroData, setHeroData] = useState<HeroSectionData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHero = async () => {
            try {
                const data = await fetchHeroSection();
                if (data && data.image) {
                    setHeroData(data);
                }
            } catch (error) {
                console.error('Failed to load hero section:', error);
            } finally {
                setLoading(false);
            }
        };

        loadHero();
    }, []);

    if (loading) {
        return (
            <div className="relative h-[600px] w-full bg-gray-100 animate-pulse flex items-center justify-center">
                <span className="sr-only">Loading hero section...</span>
            </div>
        );
    }

    // Fallback if no data or no image
    if (!heroData) {
        return (
            <div className="relative h-[600px] w-full bg-gray-900 flex items-center justify-center text-white">
                <div className="text-center px-4">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome to TravelApp</h1>
                    <p className="text-xl md:text-2xl text-gray-300 mb-8">Discover your next adventure</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Image
                src={`${IMAGE_URL}${heroData.image}`}
                alt="Hero Banner"
                width={1920}
                height={750}
                priority
                style={{ width: '100%', height: 'auto' }}
            />
            <h1>{heroData.title}</h1>
            <p>{heroData.subtitle}</p>
        </div>
    );
}
