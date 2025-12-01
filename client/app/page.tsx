import { fetchFeaturedPackages, fetchFeaturedBlogs, fetchFeaturedTestimonials, Package, Blog, Testimonial } from '@/lib/api';
import HeroSection from '@/components/HeroSection/HeroSection';
import FeaturedPackages from '@/components/FeaturedPackages/FeaturedPackages';
import BestsellingPackages from '@/components/BestsellingPackages/BestsellingPackages';
import { FeaturedPlaces } from '@/components/FeaturedPlaces/FeaturedPlaces';
import BestsellingTestimonials from '@/components/BestsellingTestimonials/BestsellingTestimonials';
import BestsellingBlogs from '@/components/BestsellingBlogs/BestsellingBlogs';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';

// Types imported from lib/api.ts

export default async function Home() {


  return (
    <div>
      <Header />
      <main className="min-h-screen">
        <HeroSection />
        <FeaturedPlaces />
        <FeaturedPackages />
        <BestsellingPackages />
        <BestsellingTestimonials />
        <BestsellingBlogs />
      </main>
      <Footer />
    </div>
  );
}
