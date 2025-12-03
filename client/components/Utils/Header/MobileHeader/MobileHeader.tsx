'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BASE_URL } from '@/lib/constants';
import logo from '@/public/Logo.svg';
import HomeSearch from '@/components/HomeSearch/HomeSearch';

interface MenuItem {
    id: number;
    item_title?: string;
    title?: string;
    url_segment?: string;
    url?: string;
    has_children?: boolean;
    children?: MenuItem[];
    sections?: any[];
}

interface MobileHeaderProps {
    menuData: MenuItem[];
    settingsData: any;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ menuData = [], settingsData }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        if (isMenuOpen) {
            setOpenMenus({}); // Close all submenus when closing main menu
        }
    };

    const toggleSubmenu = (title: string) => {
        setOpenMenus(prev => {
            const isOpen = prev[title];
            return isOpen ? {} : { [title]: true };
        });
    };

    // Prevent body scroll when search is open and handle ESC key
    useEffect(() => {
        if (isSearchOpen) {
            document.body.style.overflow = 'hidden';
            
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    setIsSearchOpen(false);
                }
            };
            
            document.addEventListener('keydown', handleEscape);
            return () => {
                document.body.style.overflow = '';
                document.removeEventListener('keydown', handleEscape);
            };
        } else {
            document.body.style.overflow = '';
        }
    }, [isSearchOpen]);

    return (
        <>
            {/* Top Bar */}
            <div className="bg-white container py-3">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="inline-block">
                        <Image src={logo} alt="logo" height={50} width={150} />
                    </Link>

                    <div className="action-group flex items-center gap-3">
                        <button 
                            onClick={() => setIsSearchOpen(true)}
                            className="hover:cursor-pointer transition-opacity"
                            aria-label="Open search"
                        >
                            <svg
                                className="icon text-primary"
                                width="24"
                                height="24">
                                <use
                                    xlinkHref="/icons.svg#headersearch"
                                    fill="currentColor"></use>
                            </svg>
                        </button>


                        {/* Hamburger Menu */}
                        <button onClick={toggleMenu} className="p-1">
                            {isMenuOpen ? (
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-medium text-gray-700">Close</span>
                                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-medium text-gray-700">Menu</span>
                                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    </div>

                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 backdrop-blur-sm bg-black/10 z-50 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                style={{ top: '73px' }}
                onClick={toggleMenu}
            >
                <nav
                    className={`bg-white shadow-lg container transition-all duration-300 ease-in-out grid ${isMenuOpen ? 'grid-rows-[1fr] pb-2' : 'grid-rows-[0fr] py-0'
                        }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="overflow-hidden">
                        <ul className="space-y-1">
                            {menuData.map((menu) => {
                                const title = menu.item_title || menu.title || '';
                                const url = menu.url_segment || menu.url || '#';
                                const hasChildren = menu.has_children || (menu.children && menu.children.length > 0) || (menu.sections && menu.sections.length > 0);
                                const isOpen = openMenus[title];

                                return (
                                    <li key={menu.id} className="border-b border-gray-100">
                                        <div className="flex items-center justify-between py-3">
                                            {!hasChildren ? (
                                                <Link
                                                    href={`${BASE_URL}${url}`}
                                                    onClick={toggleMenu}
                                                    className="flex-1 text-[15px] font-medium text-headings capitalize"
                                                >
                                                    {title}
                                                </Link>
                                            ) : (
                                                <button
                                                    onClick={() => toggleSubmenu(title)}
                                                    className="flex-1 flex items-center justify-between text-[15px] font-medium text-headings hover:cursor-pointer capitalize"
                                                >
                                                    <span>{title}</span>
                                                    <span
                                                        className={`text-xl w-5 h-5 rounded-full bg-primary/30 flex text-[16px] items-center text-center justify-center text-primary transition-transform duration-300`}
                                                    >
                                                        {isOpen ? "−" : "+"}
                                                    </span>


                                                </button>
                                            )}
                                        </div>


                                        {hasChildren && (
                                            <div
                                                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                                    }`}
                                            >
                                                <div className="overflow-hidden">
                                                    <ul className="pl-4 pb-1">
                                                        {menu.children?.map((child) => (
                                                            <li key={child.id}>
                                                                <Link
                                                                    href={`${BASE_URL}${child.url_segment || child.url || '#'}`}
                                                                    onClick={toggleMenu}
                                                                    className="block py-2 text-sm text-gray-600 capitalize hover:text-primary"
                                                                >
                                                                    {child.item_title || child.title}
                                                                </Link>
                                                            </li>
                                                        ))}

                                                        {menu.sections?.map((section) => (
                                                            <li key={section.id}>
                                                                <Link
                                                                    href={`${BASE_URL}${section.url || '#'}`}
                                                                    onClick={toggleMenu}
                                                                    className="block py-2 text-sm font-medium text-gray-700 capitalize hover:text-primary"
                                                                >
                                                                    {section.title}
                                                                </Link>
                                                                {section.children?.map((child: any) => (
                                                                    <Link
                                                                        key={child.id}
                                                                        href={`${BASE_URL}${child.url || '#'}`}
                                                                        onClick={toggleMenu}
                                                                        className="block py-1.5 pl-4 text-sm text-gray-600 capitalize hover:text-primary"
                                                                    >
                                                                        {child.title}
                                                                    </Link>
                                                                ))}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </nav>
            </div>

            {/* Full-screen search overlay */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20">
                    {/* Blurred backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-300 ease-out animate-fadeInScale"
                        onClick={() => setIsSearchOpen(false)}
                    />

                    {/* Search container */}
                    <div className="relative z-10 w-full max-w-4xl px-6 animate-fadeInScale">
                        {/* HomeSearch component */}
                        <HomeSearch initialQuery={searchQuery} />

                        {/* Popular searches */}
                        <div className="mt-8">
                            <p className="text-sm font-semibold mb-3 text-white/90">Popular Searches:</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {['Annapurna Base Camp', 'Everest Base Camp', 'Langtang Vally Trekking'].map(
                                    (term) => (
                                        <button
                                            key={term}
                                            onClick={() => setSearchQuery(term)}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm text-white backdrop-blur-sm transition-colors"
                                        >
                                            {term}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Helper text */}
                        <p className="mt-4 text-center text-white/80 text-sm">
                            Press <kbd className="px-2 py-1 bg-white/20 rounded">ESC</kbd> to close
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default MobileHeader;