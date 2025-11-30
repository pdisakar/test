import Link from 'next/link';
import Image from 'next/image';
import { fetchFeaturedPlaces } from '@/lib/api';
import { IMAGE_URL } from '@/lib/constants';

export const FeaturedPlaces = async () => {
    const places = await fetchFeaturedPlaces();
    console.log(places);



    return (
        <section className="py-16">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Popular Destinations
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Explore our most sought-after locations and start planning your next adventure.
                    </p>
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
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

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
            </div>
        </section>
    );
};
