import { fetchFeaturedPackages, fetchFeaturedBlogs, fetchFeaturedTestimonials, Package, Blog, Testimonial } from '@/lib/api';
import HeroSection from '@/components/HeroSection/HeroSection';
import FeaturedPackages from '@/components/FeaturedPackages/FeaturedPackages';

// Types imported from lib/api.ts

export default function Home() {


  return (
    <div className="">

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />
        {/* Featured Packages */}
        <FeaturedPackages />
      </main>
    </div>
  );
}
