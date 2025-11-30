import React from 'react';
import { fetchHeroSection } from '@/lib/api';
import { IMAGE_URL } from '@/lib/constants';
import Image from 'next/image';

export default async function HeroSection() {
    // Fetch data server-side
    const heroData = await fetchHeroSection();

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
