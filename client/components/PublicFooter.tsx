'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export function PublicFooter() {
    return (
        <footer className="bg-gray-900 text-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <div className="h-4 w-4 rounded-full border-2 border-primary"></div>
                            </div>
                            <span className="font-bold text-xl">TravelApp</span>
                        </div>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            Discover the world with us. We provide the best travel packages and experiences for your dream vacation.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/" className="text-gray-400 hover:text-primary transition-colors">Home</Link>
                            </li>
                            <li>
                                <Link href="/packages" className="text-gray-400 hover:text-primary transition-colors">Packages</Link>
                            </li>
                            <li>
                                <Link href="/blogs" className="text-gray-400 hover:text-primary transition-colors">Blogs</Link>
                            </li>
                            <li>
                                <Link href="/about" className="text-gray-400 hover:text-primary transition-colors">About Us</Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-gray-400 hover:text-primary transition-colors">Contact Us</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6">Support</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/faq" className="text-gray-400 hover:text-primary transition-colors">FAQ</Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-gray-400 hover:text-primary transition-colors">Terms & Conditions</Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-gray-400 hover:text-primary transition-colors">Privacy Policy</Link>
                            </li>
                            <li>
                                <Link href="/support" className="text-gray-400 hover:text-primary transition-colors">Help Center</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6">Contact Us</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-gray-400">
                                <MapPin className="h-5 w-5 text-primary shrink-0 mt-1" />
                                <span>123 Travel Street, Adventure City, AC 12345</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-400">
                                <Phone className="h-5 w-5 text-primary shrink-0" />
                                <span>+1 (555) 123-4567</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-400">
                                <Mail className="h-5 w-5 text-primary shrink-0" />
                                <span>info@travelapp.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} TravelApp. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
