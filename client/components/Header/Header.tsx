import { fetchHeaderMenu, fetchGlobalData } from '@/lib/api';
import Link from 'next/link';

export default async function Header() {
    const headerMenu = await fetchHeaderMenu();
    const settings = await fetchGlobalData();

    console.log('headerMenu', headerMenu);




    return (
        <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
            header
        </header>
    );
}
