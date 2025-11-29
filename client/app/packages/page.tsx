'use client';

import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { Button } from '@/components/Button';
import Link from 'next/link';
import { Calendar, Star, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Package {
    id: number;
    title: string;
    slug: string;
    duration: number;
    durationUnit: string;
    defaultPrice: number;
    featuredImage: string;
    description: string;
}

export default function PackagesPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/packages');
                const data = await response.json();
                if (data.success && Array.isArray(data.packages)) {
                    setPackages(data.packages);
                }
            } catch (error) {
                console.error('Error fetching packages:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);

    const filteredPackages = packages.filter(pkg =>
        pkg.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <PublicHeader />

            <main className="flex-1">
                {/* Header */}
                <div className="bg-gray-50 py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Tour Packages</h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                            Explore our wide range of tour packages designed to give you the best travel experience.
                        </p>

                        {/* Search */}
                        <div className="max-w-md mx-auto relative">
                            <input
                                type="text"
                                placeholder="Search destinations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Packages Grid */}
                <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-gray-100 rounded-2xl h-[400px] animate-pulse"></div>
                            ))}
                        </div>
                    ) : filteredPackages.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredPackages.map((pkg) => (
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
                                        <p className="text-gray-600 line-clamp-2 mb-4 text-sm">
                                            {pkg.description || 'Experience the beauty of this amazing destination with our comprehensive tour package.'}
                                        </p>
                                        <Link href={`/packages/${pkg.slug}`}>
                                            <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white">
                                                View Details
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No packages found</h3>
                            <p className="text-gray-600">Try adjusting your search terms.</p>
                        </div>
                    )}
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
