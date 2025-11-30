'use client';

import Link from 'next/link';
import { Button } from '@/components/Button';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { fetchHeaderMenu, MenuItem } from '@/lib/api';

// Recursive Menu Item for Desktop
const DesktopMenuItem = ({ item, depth = 0 }: { item: MenuItem; depth?: number }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = item.children && item.children.length > 0;
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 100); // Small delay to prevent flickering
    };

    if (!hasChildren) {
        return (
            <Link
                href={item.url || '#'}
                className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary whitespace-nowrap ${depth > 0 ? 'w-full' : ''}`}
            >
                {item.title}
            </Link>
        );
    }

    return (
        <div
            className={`relative group ${depth > 0 ? 'w-full' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                className={`flex items-center justify-between gap-1 text-gray-600 hover:text-primary font-medium transition-colors py-2 ${depth > 0 ? 'w-full px-4 text-sm' : ''}`}
                onClick={(e) => {
                    e.preventDefault();
                    // Optional: Toggle on click for touch devices if needed
                }}
            >
                {item.title}
                {depth > 0 ? (
                    <ChevronRight className="h-4 w-4" />
                ) : (
                    <ChevronDown className="h-4 w-4" />
                )}
            </button>

            {/* Dropdown Menu */}
            <div
                className={`absolute z-50 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 transition-all duration-200 ease-in-out ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'} ${depth > 0 ? 'left-full top-0 ml-1' : 'left-0 top-full mt-0'
                    }`}
            >
                <div className="py-1" role="menu" aria-orientation="vertical">
                    {item.children!.map((child) => (
                        <DesktopMenuItem key={child.id} item={child} depth={depth + 1} />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Recursive Menu Item for Mobile
const MobileMenuItem = ({ item, depth = 0, closeMenu }: { item: MenuItem; depth?: number; closeMenu: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = item.children && item.children.length > 0;

    if (!hasChildren) {
        return (
            <Link
                href={item.url || '#'}
                className={`block py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 ${depth > 0 ? 'text-sm pl-4' : 'px-3'}`}
                style={{ paddingLeft: depth > 0 ? `${depth * 1 + 0.75}rem` : undefined }}
                onClick={closeMenu}
            >
                {item.title}
            </Link>
        );
    }

    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 ${depth > 0 ? 'text-sm pl-4' : 'px-3'}`}
                style={{ paddingLeft: depth > 0 ? `${depth * 1 + 0.75}rem` : undefined }}
            >
                {item.title}
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="space-y-1 bg-gray-50/50 rounded-md mt-1">
                    {item.children!.map((child) => (
                        <MobileMenuItem key={child.id} item={child} depth={depth + 1} closeMenu={closeMenu} />
                    ))}
                </div>
            )}
        </div>
    );
};

export function PublicHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const data = await fetchHeaderMenu();
                if (data) {
                    // Build hierarchy
                    const itemMap = new Map();
                    const rootItems: MenuItem[] = [];

                    // First pass: Create nodes and map them
                    data.forEach((item: any) => {
                        itemMap.set(item.id, { ...item, children: [] });
                    });

                    // Second pass: Link parents and children
                    data.forEach((item: any) => {
                        const node = itemMap.get(item.id);
                        if (item.parentId) {
                            const parent = itemMap.get(item.parentId);
                            if (parent) {
                                parent.children.push(node);
                            }
                        } else {
                            rootItems.push(node);
                        }
                    });

                    // Sort by displayOrder recursively
                    const sortItems = (items: MenuItem[]) => {
                        items.sort((a, b) => a.displayOrder - b.displayOrder);
                        items.forEach(item => {
                            if (item.children && item.children.length > 0) {
                                sortItems(item.children);
                            }
                        });
                    };

                    sortItems(rootItems);
                    setMenuItems(rootItems);
                }
            } catch (error) {
                console.error('Failed to fetch menus:', error);
            }
        };

        fetchMenus();
    }, []);

    console.log(menuItems);


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
                    <nav className="hidden md:flex space-x-1">
                        {menuItems.map((item) => (
                            <DesktopMenuItem key={item.id} item={item} />
                        ))}
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
                <div className="md:hidden bg-white border-t border-gray-100 max-h-[calc(100vh-4rem)] overflow-y-auto">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {menuItems.map((item) => (
                            <MobileMenuItem key={item.id} item={item} closeMenu={() => setIsMenuOpen(false)} />
                        ))}

                        <div className="pt-4 flex flex-col gap-2 border-t border-gray-100 mt-2">
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
