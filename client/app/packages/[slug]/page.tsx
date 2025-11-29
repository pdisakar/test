'use client';

import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { Button } from '@/components/Button';
import { Calendar, MapPin, Clock, Users, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Package {
    id: number;
    title: string;
    slug: string;
    duration: number;
    durationUnit: string;
    defaultPrice: number;
    featuredImage: string;
    bannerImage: string;
    description: string;
    included: string;
    excluded: string;
    itinerary: string; // Assuming JSON string or similar
}

export default function PackageDetailsPage() {
    const params = useParams();
    const [pkg, setPkg] = useState<Package | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPackage = async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/packages/${params.slug}`);
                const data = await response.json();
                if (data.success) {
                    setPkg(data.package);
                }
            } catch (error) {
                console.error('Error fetching package:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.slug) {
            fetchPackage();
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

    if (!pkg) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <PublicHeader />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <h1 className="text-2xl font-bold mb-4">Package Not Found</h1>
                    <Button onClick={() => window.history.back()}>Go Back</Button>
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
                    <div className="absolute inset-0 bg-gray-900/40 z-10"></div>
                    <img
                        src={pkg.bannerImage || pkg.featuredImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2021&q=80'}
                        alt={pkg.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-8 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="max-w-7xl mx-auto">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{pkg.title}</h1>
                            <div className="flex flex-wrap items-center gap-6 text-white/90">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    <span>{pkg.duration} {pkg.durationUnit}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    <span>Main Destination</span>
                                </div>
                                <div className="text-2xl font-bold text-primary">
                                    ${pkg.defaultPrice}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-12">
                            {/* Overview */}
                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
                                <div className="prose max-w-none text-gray-600">
                                    {pkg.description}
                                </div>
                            </section>

                            {/* Itinerary - Placeholder if not structured */}
                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Itinerary</h2>
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                    <p className="text-gray-600">
                                        Detailed itinerary will be displayed here.
                                    </p>
                                </div>
                            </section>

                            {/* Included/Excluded */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section>
                                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Check className="h-5 w-5 text-green-500" /> Included
                                    </h2>
                                    <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                                        <p className="text-gray-600 whitespace-pre-line">
                                            {pkg.included || 'Accommodation\nBreakfast\nTransportation\nGuide'}
                                        </p>
                                    </div>
                                </section>
                                <section>
                                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <X className="h-5 w-5 text-red-500" /> Excluded
                                    </h2>
                                    <div className="bg-red-50 rounded-xl p-6 border border-red-100">
                                        <p className="text-gray-600 whitespace-pre-line">
                                            {pkg.excluded || 'International Flights\nVisa Fees\nPersonal Expenses\nTips'}
                                        </p>
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Book This Tour</h3>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                        <span className="text-gray-600">Duration</span>
                                        <span className="font-medium text-gray-900">{pkg.duration} {pkg.durationUnit}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                        <span className="text-gray-600">Price per person</span>
                                        <span className="font-bold text-2xl text-primary">${pkg.defaultPrice}</span>
                                    </div>
                                </div>

                                <Button className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg mb-4">
                                    Book Now
                                </Button>
                                <Button variant="outline" className="w-full py-6 text-lg">
                                    Enquire Now
                                </Button>

                                <p className="text-xs text-center text-gray-500 mt-4">
                                    * Prices may vary based on group size and season.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
