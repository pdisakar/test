'use client';

import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { Button } from '@/components/Button';
import Link from 'next/link';
import { ArrowRight, Calendar, Star, Quote } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchFeaturedPackages, fetchFeaturedBlogs, fetchFeaturedTestimonials, Package, Blog, Testimonial } from '@/lib/api';
import { HeroSection } from '@/components/HeroSection/HeroSection';

// Types imported from lib/api.ts

export default function Home() {
  const [featuredPackages, setFeaturedPackages] = useState<Package[]>([]);
  const [featuredBlogs, setFeaturedBlogs] = useState<Blog[]>([]);
  const [featuredTestimonials, setFeaturedTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [packagesData, blogsData, testimonialsData] = await Promise.all([
          fetchFeaturedPackages(),
          fetchFeaturedBlogs(),
          fetchFeaturedTestimonials()
        ]);

        // API helpers return arrays directly
        setFeaturedPackages(packagesData);
        setFeaturedBlogs(blogsData);
        setFeaturedTestimonials(testimonialsData);



      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />


        {/* Featured Packages */}

      </main>
    </div>
  );
}
