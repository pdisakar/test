'use client';

import Link from 'next/link';
import { Button } from '@/components/Button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function PublicHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <div className="h-4 w-4 rounded-full border-2 border-primary"></div>
                            </div>
                            <span className="font-bold text-xl text-gray-900">TravelApp</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        <Link href="/" className="text-gray-600 hover:text-primary font-medium transition-colors">
                            Home
                        </Link>
                        <Link href="/packages" className="text-gray-600 hover:text-primary font-medium transition-colors">
                            Packages
                        </Link>
                        <Link href="/blogs" className="text-gray-600 hover:text-primary font-medium transition-colors">
                            Blogs
                        </Link>
                        <Link href="/about" className="text-gray-600 hover:text-primary font-medium transition-colors">
                            About Us
                        </Link>
                        <Link href="/contact" className="text-gray-600 hover:text-primary font-medium transition-colors">
                            Contact
                        </Link>
                    </nav>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Link href="/login">
                            <Button variant="ghost" className="text-gray-600 hover:text-primary">
                                Login
                            </Button>
                        </Link>
                        <Link href="/packages">
                            <Button className="bg-primary hover:bg-primary/90 text-white">
                                Book Now
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-600 hover:text-primary focus:outline-none"
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link
                            href="/"
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50:bg-gray-800"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Home
                        </Link>
                        <Link
                            href="/packages"
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50:bg-gray-800"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Packages
                        </Link>
                        <Link
                            href="/blogs"
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50:bg-gray-800"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Blogs
                        </Link>
                        <Link
                            href="/about"
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50:bg-gray-800"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            About Us
                        </Link>
                        <Link
                            href="/contact"
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50:bg-gray-800"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Contact
                        </Link>
                        <div className="pt-4 flex flex-col gap-2">
                            <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                                <Button variant="outline" className="w-full justify-center">Login</Button>
                            </Link>
                            <Link href="/packages" onClick={() => setIsMenuOpen(false)}>
                                <Button className="w-full justify-center bg-primary hover:bg-primary/90 text-white">Book Now</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
