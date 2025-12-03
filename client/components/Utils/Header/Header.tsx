'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { fetchHeaderMenu, fetchGlobalData, MenuItem } from '@/lib/api';
import DesktopHeader from './DesktopHeader/DesktopHeader';
import MobileHeader from './MobileHeader/MobileHeader';

export default function Header() {
    const pathname = usePathname();
    const [headerMenu, setHeaderMenu] = useState<MenuItem[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const shouldHideHeader = pathname.startsWith('/admin') || pathname.startsWith('/login');

    useEffect(() => {
        if (shouldHideHeader) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const menu = await fetchHeaderMenu();
                const globalData = await fetchGlobalData();
                setHeaderMenu(menu);
                setSettings(globalData);
            } catch (error) {
                console.error("Failed to fetch header data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [shouldHideHeader]);

    if (isLoading || shouldHideHeader) {
        return null; 
    }

    return (
        <header>
            <div className="desktop-header hidden md:block">
                <DesktopHeader menuData={headerMenu} settingsData={settings} />
            </div>
            <div className="mobile-header md:hidden">
                <MobileHeader menuData={headerMenu} settingsData={settings} />
            </div>
        </header>
    );
}
