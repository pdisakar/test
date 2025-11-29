'use client';

import Link from 'next/link';
import { Button } from '@/components/Button';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MenuItem {
    id: number;
    title: string;
    type: string;
    parentId: number | null;
    url: string;
    status: number;
    displayOrder: number;
    children?: MenuItem[];
}

export function PublicHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/menus/type/header');
                if (response.ok) {
                    const data = await response.json();

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

                    // Sort by displayOrder
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

    const toggleDropdown = (id: number) => {
        if (activeDropdown === id) {
            setActiveDropdown(null);
        } else {
            setActiveDropdown(id);
        }
    };

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
                        {menuItems.map((item) => (
                            <div key={item.id} className="relative group">
                                {item.children && item.children.length > 0 ? (
                                    <>
                                        <button
                                            className="flex items-center gap-1 text-gray-600 hover:text-primary font-medium transition-colors py-2"
                                            onClick={() => toggleDropdown(item.id)}
                                            onMouseEnter={() => setActiveDropdown(item.id)}
                                        >
                                            {item.title}
                                            <ChevronDown className="h-4 w-4" />
                                        </button>

                                        {/* Dropdown Menu */}
                                        <div
                                            className={`absolute left-0 mt-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 transition-all duration-200 ease-in-out ${activeDropdown === item.id ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
                                                }`}
                                            onMouseLeave={() => setActiveDropdown(null)}
                                        >
                                            <div className="py-1" role="menu" aria-orientation="vertical">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.id}
                                                        href={child.url || '#'}
                                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
                                                        role="menuitem"
                                                    >
                                                        {child.title}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <Link
                                        href={item.url || '#'}
                                        className="text-gray-600 hover:text-primary font-medium transition-colors flex items-center h-full"
                                    >
                                        {item.title}
                                    </Link>
                                )}
                            </div>
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
                            <div key={item.id}>
                                {item.children && item.children.length > 0 ? (
                                    <>
                                        <button
                                            onClick={() => toggleDropdown(item.id)}
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                                        >
                                            {item.title}
                                            <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === item.id ? 'rotate-180' : ''}`} />
                                        </button>
                                        {activeDropdown === item.id && (
                                            <div className="pl-4 space-y-1 bg-gray-50 rounded-md mt-1">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.id}
                                                        href={child.url || '#'}
                                                        className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-primary"
                                                        onClick={() => setIsMenuOpen(false)}
                                                    >
                                                        {child.title}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href={item.url || '#'}
                                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {item.title}
                                    </Link>
                                )}
                            </div>
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
