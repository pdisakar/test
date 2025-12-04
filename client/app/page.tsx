import BestsellingPackages from "@/components/BestsellingPackages/BestsellingPackages";
import { FeaturedPlaces } from "@/components/FeaturedPlaces/FeaturedPlaces";
import HeroSection from "@/components/HeroSection/HeroSection";
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
    </main>
  );
}
