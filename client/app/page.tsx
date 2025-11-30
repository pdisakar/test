
import { fetchFeaturedPackages, fetchFeaturedBlogs, fetchFeaturedTestimonials, Package, Blog, Testimonial } from '@/lib/api';
import HeroSection from '@/components/HeroSection/HeroSection';

// Types imported from lib/api.ts

export default function Home() {


  return (
    <div className="">

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />

      </main>
    </div>
  );
}
