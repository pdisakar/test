import React from 'react';
import { fetchHeroSection } from '@/lib/api';
import { IMAGE_URL } from '@/lib/constants';
import Image from 'next/image';
import HomeSearch from '@/components/HomeSearch/HomeSearch';

export default async function HeroSection() {
    const heroData = await fetchHeroSection();

    if (!heroData) {
        return (
            <div className="relative h-[600px] w-full bg-gray-900 flex items-center justify-center text-white">
                <div className="text-center px-4 w-full max-w-4xl">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome to TravelApp</h1>
                    <p className="text-xl md:text-2xl text-gray-300 mb-8">Discover your next adventure</p>
                    <div className="w-full max-w-2xl mx-auto">
                        <HomeSearch />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-[600px] w-full">
            <Image
                src={`${IMAGE_URL}${heroData.image}`}
                alt="Hero Banner"
                fill
                priority
                className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white px-4">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center">{heroData.title}</h1>
                <p className="text-xl md:text-2xl text-gray-200 mb-8 text-center max-w-2xl">{heroData.subtitle}</p>
                <div className="w-full max-w-2xl">
                    <HomeSearch />
                </div>
            </div>
        </div>
    );
}
