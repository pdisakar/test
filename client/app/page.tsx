import { fetchFeaturedPackages, fetchFeaturedBlogs, fetchFeaturedTestimonials, Package, Blog, Testimonial } from '@/lib/api';
import HeroSection from '@/components/HeroSection/HeroSection';
import FeaturedPackages from '@/components/FeaturedPackages/FeaturedPackages';
import BestsellingPackages from '@/components/BestsellingPackages/BestsellingPackages';
import { FeaturedPlaces } from '@/components/FeaturedPlaces/FeaturedPlaces';
import BestsellingTestimonials from '@/components/BestsellingTestimonials/BestsellingTestimonials';
import BestsellingBlogs from '@/components/BestsellingBlogs/BestsellingBlogs';

// Types imported from lib/api.ts

export default function Home() {


  return (
    <div className="">

      <main className="flex-1">
        <HeroSection />
        <FeaturedPlaces />
        <FeaturedPackages />
        <BestsellingPackages />
        <BestsellingTestimonials />
        <BestsellingBlogs />
      </main>
    </div>
  );
}
