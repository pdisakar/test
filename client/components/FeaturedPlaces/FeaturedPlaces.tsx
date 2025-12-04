import { fetchFeaturedPlaces } from '@/lib/api';
import { PlaceCard } from '@/components/Cards/PlaceCard/PlaceCard';

interface FeaturedPlacesProps {
    pretitle?: string;
    title?: string;
    subtitle?: string;
}

export const FeaturedPlaces = async ({ pretitle, title, subtitle }: FeaturedPlacesProps) => {
    const places = await fetchFeaturedPlaces();

    return (
        <section className="py-16 container">
            <div className="title">
                {pretitle && <span>{pretitle}</span>}
                {title && <h2>{title}</h2>}
                {subtitle && <p>{subtitle}</p>}
            </div>

            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {places.map((place) => (
                    <li key={place.id}>
                        <PlaceCard data={place} />
                    </li>
                ))}
            </ul>
        </section>
    );
};
