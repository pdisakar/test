
import { fetchFeaturedPackages, Package } from '@/lib/api';

interface FeaturedPackagesProps {
    pretitle?: string;
    title?: string;
    subtitle?: string;
}

export default async function FeaturedPackages({ pretitle, title, subtitle }: FeaturedPackagesProps) {
    const packages: Package[] = await fetchFeaturedPackages();


    return (
        <section className='featured-packages common-box pt-0'>

        </section>
    );
}
