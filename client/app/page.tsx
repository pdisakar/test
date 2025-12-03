import { FeaturedPlaces } from "@/components/FeaturedPlaces/FeaturedPlaces";
import HeroSection from "@/components/HeroSection/HeroSection";

export default function Home() {

  return (
    <main>
      <HeroSection />
      <FeaturedPlaces
        pretitle='Handpicked Activities'
        title="Featured Places"
        subtitle="From Himalayan peaks to cultural treasures, Nepal offers unforgettable experiences. Here’s your shortlist of the best things to do."
      />
    </main>
  );
}
