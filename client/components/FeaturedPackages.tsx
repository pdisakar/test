import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Star } from 'lucide-react';
import { fetchFeaturedPackages, Package } from '@/lib/api';
import { Button } from '@/components/Button';

export const FeaturedPackages: React.FC = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await fetchFeaturedPackages();
            setPackages(data);
            setLoading(false);
        };
        load();
    }, []);

    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Destinations</h2>
                    <p className="text-gray-600 max-w-2xl">Our most exclusive and top‑rated packages, handpicked for you.</p>
                </div>
                <Link href="/packages" className="hidden md:flex items-center text-primary font-medium hover:underline">
                    View all packages <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="bg-gray-100 rounded-2xl h-[400px] animate-pulse" />
                    ))
                ) : packages.length > 0 ? (
                    packages.map(pkg => (
                        <div key={pkg.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src={pkg.featuredImage || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                                    alt={pkg.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-gray-900">
                                    ${pkg.defaultPrice}
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>{pkg.duration} {pkg.durationUnit}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                        <span>4.8 (24)</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                                    {pkg.title}
                                </h3>
                                <Link href={`/${pkg.slug}`}>
                                    <Button variant="outline" className="w-full mt-4 border-primary text-primary hover:bg-primary hover:text-white">
                                        View Details
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-3 text-center py-12 text-gray-500">No featured packages available.</div>
                )}
            </div>

            <div className="mt-8 text-center md:hidden">
                <Link href="/packages">
                    <Button variant="outline" className="w-full">View all packages</Button>
                </Link>
            </div>
        </section>
    );
};
