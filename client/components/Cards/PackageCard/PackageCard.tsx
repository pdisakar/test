import Link from 'next/link';
import React from 'react';
import { Package } from '@/lib/api';

interface PackageCardProps {
  data: Package;
}

export const PackageCard = ({ data }: PackageCardProps) => {
  console.log(data);

  return (
    <Link href={`/${data.slug}`}>
      {data.title}
    </Link>
  );
};
