'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BASE_URL } from '@/lib/constants';
import logo from '@/public/Logo.svg';

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

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        if (isMenuOpen) {
            setOpenMenus({}); // Close all submenus when closing main menu
        }
    };

    const toggleSubmenu = (title: string) => {
        setOpenMenus(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    return (
        <>
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="inline-block">
                        <Image src={logo} alt="logo" height={50} width={150} />
                    </Link>

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

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/10 z-50" style={{ top: '60px' }}>
                    <nav className="bg-white shadow-lg px-4 py-2">
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
                                                    className="flex-1 flex items-center justify-between text-[15px] font-medium text-headings capitalize"
                                                >
                                                    <span>{title}</span>
                                                    <svg
                                                        className={`w-5 h-5 text-primary transition-transform ${isOpen ? 'rotate-45' : ''}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>

                                        {/* Submenu */}
                                        {hasChildren && isOpen && (
                                            <ul className="pl-4 pb-2 space-y-2">
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
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </div>
            )}
        </>
    );
};

export default MobileHeader;