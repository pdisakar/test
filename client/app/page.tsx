import { fetchFeaturedPackages, fetchFeaturedBlogs, fetchFeaturedTestimonials, Package, Blog, Testimonial } from '@/lib/api';
import HeroSection from '@/components/HeroSection/HeroSection';
import FeaturedPackages from '@/components/FeaturedPackages/FeaturedPackages';
import { FeaturedPlaces } from '@/components/FeaturedPlaces/FeaturedPlaces';

// Types imported from lib/api.ts

export default function Home() {


  return (
    <div className="">

      <main className="flex-1">
        <HeroSection />
        <FeaturedPlaces />
        <FeaturedPackages />
      </main>
    </div>
  );
}
