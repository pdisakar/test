import { fetchHeaderMenu, fetchGlobalData } from '@/lib/api';
import DesktopHeader from './DesktopHeader/DesktopHeader';
import MobileHeader from './MobileHeader/MobileHeader';

export default async function Header() {
    const headerMenu = await fetchHeaderMenu();
    const settings = await fetchGlobalData();

    return (
        <header>
            <div className="desktop-header hidden md:block">
                <DesktopHeader menuData={headerMenu} settingsData={settings} />
            </div>
            {/* <div className="mobile-header md:hidden">
                <MobileHeader menuData={headerMenu} settingsData={settings} />
            </div> */}

        </header>
    );
}
