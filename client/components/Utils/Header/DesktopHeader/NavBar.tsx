'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';

export interface MenuItem {
    id: number | string;
    title?: string;
    item_title?: string;
    url?: string;
    url_segment?: string;
    children?: MenuItem[];
}

interface NavBarProps {
    menuData: MenuItem[];
}

const flattenMenuSections = (items: MenuItem[]) => {
    const sections: MenuItem[] = [];

    const traverse = (item: MenuItem) => {
        if (item.children && item.children.length > 0) {
            sections.push(item);
            item.children.forEach(child => traverse(child));
        }
    };

    items.forEach(item => traverse(item));
    return sections;
};

const NavBar: React.FC<NavBarProps> = ({ menuData = [] }) => {
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const navRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleMenu = (title: string) => {
        setOpenMenu(prev => (prev === title ? null : title));
    };

    const closeMenu = () => setOpenMenu(null);

    return (
        <nav
            ref={navRef}
            className="relative z-50 bg-navbar">
            <ul className="container flex items-center [&>li:not(:first-child)]:pl-3.5 [&>li]:pr-3.5 [&>li]:py-3">
                {menuData.map(menu => {
                    const title = menu.item_title || menu.title || '';
                    const url = menu.url_segment || menu.url || '#';
                    const children = menu.children || [];

                    const hasChildren = children.length > 0;
                    const isOpen = openMenu === title;

                    const isDeepStructure = hasChildren && children.some((child) => child.children && child.children.length > 0);

                    const isMega = isDeepStructure;
                    const isSimpleDropdown = hasChildren && !isDeepStructure;

                    const sectionsToDisplay = useMemo(() => {
                        if (isMega && children) {
                            return flattenMenuSections(children);
                        }
                        return [];
                    }, [children, isMega]);

                    return (
                        <li
                            key={menu.id}
                            className={`  ${isMega ? 'static' : 'relative'}`}>

                            {!hasChildren ? (
                                <Link
                                    href={`/${url}`}
                                    className="flex items-center group"
                                    onClick={closeMenu}>
                                    {title}
                                </Link>
                            ) : (
                                <button
                                    onClick={() => toggleMenu(title)}
                                    className={`flex items-center group font-semibold text-[15px] uppercase text-white `}>
                                    {title}
                                    <svg
                                        className={`icon text-white ml-1 transition-transform duration-200 ${isOpen ? "rotate-180" : "group-hover:rotate-180"
                                            }`}
                                        width="8"
                                        height="5"
                                        viewBox="0 0 8 5"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M3.21875 4.28906C3.375 4.42969 3.55469 4.5 3.75781 4.5C3.96094 4.5 4.14062 4.42969 4.29688 4.28906L7.29688 1.28906C7.51562 1.03906 7.57031 0.765625 7.46094 0.46875C7.32031 0.171875 7.08594 0.015625 6.75781 0H0.757812C0.429688 0.015625 0.195312 0.171875 0.0546875 0.46875C-0.0546875 0.765625 0 1.03906 0.21875 1.28906L3.21875 4.28906Z"
                                            fill="currentColor"
                                        />
                                    </svg>


                                </button>
                            )}
                            {isMega && (
                                <div
                                    className={`absolute container top-full w-full shadow-md rounded-lg z-40 max-h-[700px] overflow-y-auto transition-all duration-300 ease-out origin-top ${isOpen
                                        ? 'opacity-100 scale-100 visible'
                                        : 'pointer-events-none opacity-0 scale-95 invisible'
                                        }`}>
                                    <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                                        {sectionsToDisplay.map((section) => {
                                            const sectionTitle = section.item_title || section.title;
                                            const sectionUrl = section.url_segment || section.url || '#';

                                            return (
                                                <div key={section.id} className="break-inside-avoid">
                                                    <Link href={`/${sectionUrl}`} onClick={closeMenu}>
                                                        <p className="font-bold text-[16px] text-primary mb-2 hover:underline">
                                                            {sectionTitle}
                                                        </p>
                                                    </Link>

                                                    <ul className="space-y-1">
                                                        {section.children?.map((child) => (
                                                            <li key={child.id}>
                                                                <Link
                                                                    href={`/${child.url_segment || child.url || '#'}`}
                                                                    className="hover:text-primary text-[14px] py-1 block font-medium text-text-color transition-colors"
                                                                    onClick={closeMenu}>
                                                                    {child.item_title || child.title}
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {isSimpleDropdown && (
                                <ul
                                    className={`rounded-lg absolute left-0 top-[calc(100%+16px)] z-40 min-w-[250px] bg-page-bg shadow-lg p-4 space-y-2 transition-all duration-300 ease-out origin-top ${isOpen
                                        ? 'opacity-100 scale-100 visible'
                                        : 'pointer-events-none opacity-0 scale-95 invisible'
                                        }`}>
                                    {children.map((item) => (
                                        <li key={item.id}>
                                            <Link
                                                href={`/${item.url_segment || item.url || '#'}`}
                                                className="hover:text-primary text-sm font-medium text-text-color block"
                                                onClick={closeMenu}>
                                                {item.item_title || item.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default NavBar;
