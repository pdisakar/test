import { fetchFeaturedTestimonials, Testimonial } from '@/lib/api';
import { Carousel, CarouselContent, CarouselDots, CarouselItem } from '../Carousel/Carousel';
import { TestimonialCard } from '../Cards/TestimonialCard/TestimonialCard';

interface FeaturedTestimonialsProps {
    pretitle?: string;
    title?: string;
    subtitle?: string;
}

export default async function FeaturedTestimonials({ pretitle, title, subtitle }: FeaturedTestimonialsProps) {
    const testimonials: Testimonial[] = await fetchFeaturedTestimonials();

    if (testimonials.length === 0) {
        return null;
    }

    return (
        <section className='featured-testimonials common-box pt-0'>
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
                            {testimonials.map((testimonial) => (
                                <CarouselItem key={testimonial.id} className="min-w-0 shrink-0 grow-0 px-3 flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333336%]">
                                    <TestimonialCard data={testimonial} />
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
