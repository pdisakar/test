import Image from 'next/image';
import Link from 'next/link';
import { fetchFeaturedPackages, Package } from '@/lib/api';
import { IMAGE_URL } from '@/lib/constants';

export default async function FeaturedPackages() {
    const packages: Package[] = await fetchFeaturedPackages();

    console.log(packages);


    return (
        <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold">Featured Packages</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {packages.map((pkg) => (
                        <Link
                            key={pkg.id}
                            href={`/${pkg.slug}`}
                            className="group block rounded-xl overflow-hidden bg-white shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <div className="relative h-48 w-full">
                                <Image
                                    src={pkg.featuredImage ? `${IMAGE_URL}${pkg.featuredImage}` : '/placeholder.jpg'}
                                    alt={pkg.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform"
                                />
                            </div>
                            <div className="p-4">
                                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                    {pkg.title}
                                </h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    {pkg.duration} {pkg.durationUnit} • ${pkg.defaultPrice}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
