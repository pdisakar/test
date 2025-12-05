import BestsellingPackages from "@/components/BestsellingPackages/BestsellingPackages";
import FeaturedPackages from "@/components/FeaturedPackages/FeaturedPackages";
import { FeaturedPlaces } from "@/components/FeaturedPlaces/FeaturedPlaces";
import FeaturedTestimonials from "@/components/FeaturedTestimonials/FeaturedTestimonials";
import HeroSection from "@/components/HeroSection/HeroSection";
import HomeContent from "@/components/HomeContent/HomeContent";
import { fetchHomeContent } from "@/lib/api";
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const homeContent = await fetchHomeContent();


  return {
    title: homeContent?.meta?.title,
    description: homeContent?.meta?.description,
    alternates: {
      canonical: process.env.CANONICAL_BASE,
    },
    openGraph: {
      title: homeContent?.meta?.title,
      description: homeContent?.meta?.description,
    },
  };
}

export default function Home() {

  return (
    <main>
      <HeroSection />
      <FeaturedPlaces
        pretitle='Handpicked Activities'
        title="Featured Places"
        subtitle="From Himalayan peaks to cultural treasures, Nepal offers unforgettable experiences. Here’s your shortlist of the best things to do."
      />
      <BestsellingPackages
        pretitle='Bestselling Packages'
        title="Bestselling Packages"
        subtitle="From Himalayan peaks to cultural treasures, Nepal offers unforgettable experiences. Here’s your shortlist of the best things to do." />
      <HomeContent
        pretitle='Who Are We?' />
      <FeaturedPackages
        pretitle='Just Made For You'
        title="Featured Packages"
        subtitle="From Himalayan peaks to cultural treasures, Nepal offers unforgettable experiences. Here’s your shortlist of the best things to do." />
      <FeaturedTestimonials
        pretitle='What Our Customers Say'
        title="Featured Testimonials"
        subtitle="From Himalayan peaks to cultural treasures, Nepal offers unforgettable experiences. Here’s your shortlist of the best things to do." />
    </main>
  );
}
