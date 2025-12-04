
import { fetchBestsellingPackages, Package } from '@/lib/api';
import { Carousel, CarouselContent, CarouselDots, CarouselItem } from '../Carousel/Carousel';
import { PackageCard } from '../Cards/PackageCard/PackageCard';

interface FeaturedPlacesProps {
    pretitle?: string;
    title?: string;
    subtitle?: string;
}

export default async function BestsellingPackages({ pretitle, title, subtitle }: FeaturedPlacesProps) {
    const packages: Package[] = await fetchBestsellingPackages();

    if (packages.length === 0) {
        return null;
    }

    return (
        <section className="best-selling-packages common-box pt-0">
            <div className="container">
                <div className="title">
                    {pretitle && <span>
                        <svg
                            className="icon text-primary"
                            width="36"
                            height="26.4"
                        >
                            <use
                                xlinkHref="/icons.svg#company-logo"
                                fill="currentColor"
                            ></use>
                        </svg>
                        {pretitle}</span>}
                    {title && <h2 dangerouslySetInnerHTML={{ __html: title }} />}
                    {subtitle && <p dangerouslySetInnerHTML={{ __html: subtitle }} />}
                </div>

                <div className="mt-8">
                    <Carousel
                        options={{ align: 'start', loop: true }}
                        className="w-full"
                    >
                        <CarouselContent
                            containerClassName="p-2"
                            className="flex touch-pan-y -mt-2 -mx-4"
                        >
                            {packages.map((packagedata) => (
                                <CarouselItem key={packagedata.id} className="min-w-0 shrink-0 grow-0 px-3 flex-[0_0_100%]  md:flex-[0_0_50%] lg:flex-[0_0_33.333336%]">
                                    <PackageCard data={packagedata} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>

                        <CarouselDots className="mt-8" />
                    </Carousel>
                </div>

            </div>
        </section>
    );
}
