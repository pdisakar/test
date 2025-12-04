
import { fetchBestsellingPackages, Package } from '@/lib/api';

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


            </div>
        </section>
    );
}
