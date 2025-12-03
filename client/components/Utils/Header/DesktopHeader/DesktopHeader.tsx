'use client';
import React from 'react';
import NavBar, { MenuItem } from './NavBar';
import Image from 'next/image';
import Link from 'next/link';
import logo from '@/public/Logo.svg';

interface DesktopHeaderProps {
  menuData: MenuItem[];
  settingsData?: any;
}

const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  menuData = [],
  settingsData,
}) => {

  return (
    <>
      <div className="header container py-2.5 flex items-center justify-between gap-6">
        <Link href='/' className='inline-block'><Image src={logo} alt="logo" height={70} width={220} /></Link>
        <div className="whatsapp flex items-center gap-2">
          <svg
            className="icon"
            width="36"
            height="36">
            <use
              xlinkHref="/icons.svg#headerwhatsapp"
              fill="currentColor"></use>
          </svg>
          <div className="whatsappbody">
            <span className='block text-sm font-semibold leading-[100%] text-headings'>Call or WhatsApp</span>
            <span className='block font-semibold leading-[100%] text-primary mt-1.5'>+977 {settingsData.mobileNumber1}</span>
          </div>
        </div>
      </div>
      <NavBar menuData={menuData} />
    </>
  );
};

export default DesktopHeader;