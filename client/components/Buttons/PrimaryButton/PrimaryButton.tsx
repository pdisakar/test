import Link from 'next/link';
import React from 'react';

interface PrimaryButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const PrimaryButton = ({ href, children, className = '' }: PrimaryButtonProps) => {
  return (
    <Link 
      href={href} 
      className={`relative group cursor-pointer text-white overflow-hidden h-10.5 w-50 rounded-full bg-[#0068a7] p-2 flex justify-center items-center font-semibold ${className}`}
    >
      <div className="absolute top-3 right-20 group-hover:top-12 group-hover:-right-8 z-10 w-32 h-32 rounded-full group-hover:scale-150 group-hover:opacity-50 duration-500 bg-[#3785c9]"></div>
      <div className="absolute top-3 right-20 group-hover:top-12 group-hover:-right-8 z-10 w-24 h-24 rounded-full group-hover:scale-150 group-hover:opacity-50 duration-500 bg-[#4592da]"></div>
      <p className="z-10">{children}</p>
    </Link>
  );
};

export default PrimaryButton;