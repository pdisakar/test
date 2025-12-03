import Link from 'next/link';
import Image from 'next/image';
import { fetchFeaturedPlaces } from '@/lib/api';
import { IMAGE_URL } from '@/lib/constants';

interface FeaturedPlacesProps {
    pretitle?: string;
    title?: string;
    subtitle?: string;
}

export const FeaturedPlaces = async ({ pretitle, title, subtitle }: FeaturedPlacesProps) => {
    const places = await fetchFeaturedPlaces();

    console.log(places);


    return (
        <section className="py-16 container">
            <div className="title">
                {pretitle && <span>{pretitle}</span>}
                {title && <h2>{title}</h2>}
                {subtitle && <p>{subtitle}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {places.map((place) => (
                    <Link
                        href={`/${place.slug}`}
                        key={place.id}
                        className="group relative overflow-hidden rounded-2xl aspect-[4/3] block"
                    >
                        <Image
                            src={place.featuredImage ? `${IMAGE_URL}${place.featuredImage}` : '/placeholder.jpg'}
                            alt={place.featuredImageAlt || place.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                        <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                            <h3 className="text-2xl font-bold text-white mb-2">{place.title}</h3>
                            {place.description && (
                                <div
                                    className="text-gray-200 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100"
                                    dangerouslySetInnerHTML={{ __html: place.description }}
                                />
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};
