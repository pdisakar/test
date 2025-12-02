import { fetchFeaturedPackages, fetchFeaturedBlogs, fetchFeaturedTestimonials, fetchHomeContent, Package, Blog, Testimonial } from '@/lib/api';
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
  const homeContent = await fetchHomeContent();

  return (
    <div>
      <Header />
      <main className="min-h-screen">
        <HeroSection />
        
        {/* Home Content Section */}
        {homeContent && (homeContent.content || homeContent.bannerImage) && (
          <section className="py-16 bg-white dark:bg-gray-900">
            <div className="container mx-auto px-4">
              {homeContent.bannerImage && (
                <div className="mb-10 rounded-2xl overflow-hidden shadow-lg">
                  <img 
                    src={homeContent.bannerImage} 
                    alt="Welcome to our site" 
                    className="w-full h-[400px] object-cover"
                  />
                </div>
              )}
              {homeContent.content && (
                <div 
                  className="prose prose-lg max-w-4xl mx-auto dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: homeContent.content }} 
                />
              )}
            </div>
          </section>
        )}

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
