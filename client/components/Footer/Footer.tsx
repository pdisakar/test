import { fetchFooterMenu, fetchGlobalData } from '@/lib/api';
import Link from 'next/link';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube, FaPinterestP } from 'react-icons/fa';

export default async function Footer() {
    const footerMenu = await fetchFooterMenu();
    const settings = await fetchGlobalData();

    console.log('footer menu', footerMenu);



   

    return (
        <footer className="bg-gray-900 text-white pt-16 pb-8">
            footer
        </footer>
    );
}
