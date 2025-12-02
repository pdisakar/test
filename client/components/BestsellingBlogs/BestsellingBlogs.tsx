
import { fetchFeaturedBlogs, Blog } from '@/lib/api';

export default async function BestsellingBlogs() {
    const blogs: Blog[] = await fetchFeaturedBlogs();



    return (
        <section className="">

        </section>
    );
}
