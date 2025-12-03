import { fetchHeroSection } from '@/lib/api';
import { IMAGE_URL } from '@/lib/constants';
import Image from 'next/image';
import HomeSearch from '@/components/HomeSearch/HomeSearch';

export default async function HeroSection() {
    const heroData = await fetchHeroSection();
    console.log(heroData);


    return (
        <div className="relative w-full">
            <span className="absolute inset-0 bg-black/10 z-20"></span>
            <figure className="image-slot aspect-[1920/750]">
                <Image
                    src={`${IMAGE_URL}${heroData?.image}`}
                    alt="Hero Banner"
                    height={750}
                    width={1920}
                    priority
                    className="object-cover min-h-[400px]"
                />
            </figure>

            <figcaption className="absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-[730px]">
                <span className="text-[1.125rem] text-shadow-lg  text-center font-semibold text-white items-center justify-center mb-3 block gap-2">{heroData?.subtitle}</span>
                <h1 className="text-[clamp(32px,5vw,52px)] text-shadow-lg  text-center text-white font-black leading-[1.2]">{heroData?.title}</h1>
                <div className="hidden md:block mt-4">
                    <HomeSearch />
                </div>
            </figcaption>
        </div>
    );
}
