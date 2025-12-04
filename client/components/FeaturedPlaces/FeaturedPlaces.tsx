import { fetchFeaturedPlaces } from '@/lib/api';
import { PlaceCard } from '@/components/Cards/PlaceCard/PlaceCard';
import { Carousel, CarouselContent, CarouselItem, CarouselDots } from '@/components/Carousel/Carousel';

interface FeaturedPlacesProps {
    pretitle?: string;
    title?: string;
    subtitle?: string;
}

export const FeaturedPlaces = async ({ pretitle, title, subtitle }: FeaturedPlacesProps) => {
    const places = await fetchFeaturedPlaces();

    return (
        <section className="featured-places common-box">
            <div className="container">
                <div className="title">
                    {pretitle && <span>   <svg
                        className="icon text-primary"
                        width="36"
                        height="36"
                    >
                        <use
                            xlinkHref="/icons.svg#company-logo"
                            fill="currentColor"
                        ></use>
                    </svg>
                        {pretitle}</span>}
                    {title && <h2>{title}</h2>}
                    {subtitle && <p>{subtitle}</p>}
                </div>

                <div className="mt-8">
                    <Carousel
                        options={{ align: 'start', loop: true }}
                        className="w-full"
                    >
                        <CarouselContent className="flex touch-pan-y -mx-3">
                            {places.map((place) => (
                                <CarouselItem key={place.id} className="min-w-0 shrink-0 grow-0 px-3 flex-[0_0_100%] sm:flex-[0_0_50%] md:flex-[0_0_33.3333334%] lg:flex-[0_0_25%] h-full">
                                    <PlaceCard data={place} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>

                        <CarouselDots className="mt-6" />
                    </Carousel>
                </div>
            </div>
        </section>

    );
};
