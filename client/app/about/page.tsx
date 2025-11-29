'use client';

import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';
import { Button } from '@/components/Button';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <PublicHeader />

            <main className="flex-1">
                {/* Hero */}
                <div className="bg-gray-50 py-20">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">About Us</h1>
                        <p className="text-xl text-gray-600 leading-relaxed">
                            We are passionate about creating unforgettable travel experiences that inspire and delight.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Our Story */}
                        <section className="mb-16">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
                            <div className="prose prose-lg max-w-none">
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    Founded in 2020, TravelApp began with a simple mission: to make world-class travel experiences accessible to everyone.
                                    Our team of passionate travelers has explored every corner of the globe to bring you curated packages that combine
                                    adventure, culture, and comfort.
                                </p>
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    With years of experience in the travel industry, we understand what makes a trip truly memorable. From the bustling
                                    streets of ancient cities to the serene beauty of untouched nature, we've crafted experiences that go beyond ordinary tourism.
                                </p>
                                <p className="text-gray-600 leading-relaxed">
                                    Today, we're proud to serve thousands of satisfied travelers who trust us to turn their dream vacations into reality.
                                </p>
                            </div>
                        </section>

                        {/* Mission & Vision */}
                        <section className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-gray-50 rounded-2xl p-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    To provide exceptional travel experiences that create lasting memories, foster cultural understanding,
                                    and inspire a love for exploration.
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    To be the world's most trusted travel partner, known for our commitment to quality, sustainability,
                                    and creating positive impact in the communities we visit.
                                </p>
                            </div>
                        </section>

                        {/* Values */}
                        <section className="mb-16">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Values</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Globe className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Authenticity</h3>
                                    <p className="text-gray-600">
                                        We provide genuine cultural experiences that respect local traditions.
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MapPin className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Excellence</h3>
                                    <p className="text-gray-600">
                                        We strive for perfection in every detail of your journey.
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Mail className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Support</h3>
                                    <p className="text-gray-600">
                                        We're with you every step of the way, before, during, and after your trip.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* CTA */}
                        <section className="bg-primary/5 rounded-2xl p-12 text-center">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Start Your Adventure?</h2>
                            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                                Join thousands of happy travelers who have discovered the world with us.
                            </p>
                            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg">
                                Explore Our Packages
                            </Button>
                        </section>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
