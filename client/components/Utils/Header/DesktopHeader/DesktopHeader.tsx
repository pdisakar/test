'use client';
import React from 'react';
import NavBar, { MenuItem } from './NavBar';

interface DesktopHeaderProps {
  menuData: MenuItem[];
  settingsData?: any;
}

const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  menuData = [],
  settingsData,
}) => {
  return (
    <div className="">
      <NavBar menuData={menuData} />
    </div>
  );
};

export default DesktopHeader;