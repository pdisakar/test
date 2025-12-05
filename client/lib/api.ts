const BASE_URL = 'http://localhost:3001/api';

const CACHE_REVALIDATE_TIME = 21600; // 6 hours

export interface Package {
    id: number;
    title: string;
    slug: string;
    duration: number;
    durationUnit: string;
    defaultPrice: number;
    featuredImage: string;
    featured: number;
    isBestselling?: number;
    carouselOrder?: number;
    description?: string;
    testimonials?: any[];
    total_testimonials?: number;
    statusRibbon?: string;
    groupSize?: number;
    maxAltitude?: number;
    featuredImageAlt?: string;
}

export interface Blog {
    id: number;
    title: string;
    slug: string;
    abstract: string;
    publishedDate: string;
    featuredImage: string;
    isFeatured: number;
    carouselOrder?: number;
}

export interface Testimonial {
    slug: any;
    id: number;
    reviewTitle: string;
    fullName: string;
    rating: number;
    description: string; // HTML content
    avatar: string;
    isFeatured: number;
    address: string;
    carouselOrder?: number;
}

export interface MenuItem {
    id: number;
    title: string;
    type: string;
    parentId: number | null;
    url: string;
    status: number;
    displayOrder: number;
    children?: MenuItem[];
}

export interface HeroSectionData {
    id: number;
    image: string;
    imageAlt?: string;
    imageCaption?: string;
    title: string;
    subtitle: string;
}

export interface Place {
    id: number;
    title: string;
    slug: string;
    featuredImage: string;
    featuredImageAlt?: string;
    featuredImageCaption?: string;
    packageCount?: number;
}

export interface HomeContent {
    id: number;
    title: string;
    content: string;
    bannerImage: string;
    bannerImageAlt?: string;
    bannerImageCaption?: string;
    pageType?: string;
    meta: {
        title: string;
        keywords: string;
        description: string;
    };
}

// Fetch featured packages (build‑time only)
export const fetchFeaturedPackages = async (): Promise<Package[]> => {
    const res = await fetch(`${BASE_URL}/packages?featured=1`, { next: { revalidate: CACHE_REVALIDATE_TIME } });
    const data = await res.json();
    // The endpoint returns { success, packages, ... }
    if (data.success && Array.isArray(data.packages)) {
        // Parse tripFacts JSON if present
        const packages = data.packages.slice(0, 6).map((pkg: any) => {
            if (typeof pkg.tripFacts === 'string') {
                try {
                    pkg.tripFacts = JSON.parse(pkg.tripFacts);
                } catch (e) {
                    console.error('Failed to parse tripFacts for package', pkg.id, e);
                    pkg.tripFacts = {} as Record<string, string | null>;
                }
            }
            return pkg as Package;
        });
        return packages;
    }
    return [];
};

// Fetch bestselling packages (build‑time only)
export const fetchBestsellingPackages = async (): Promise<Package[]> => {
    const res = await fetch(`${BASE_URL}/packages?isBestselling=1`, { next: { revalidate: CACHE_REVALIDATE_TIME } });
    const data = await res.json();
    if (data.success && Array.isArray(data.packages)) {
        const packages = data.packages.slice(0, 6).map((pkg: any) => {
            if (typeof pkg.tripFacts === 'string') {
                try {
                    pkg.tripFacts = JSON.parse(pkg.tripFacts);
                } catch (e) {
                    console.error('Failed to parse tripFacts for package', pkg.id, e);
                    pkg.tripFacts = {} as Record<string, string | null>;
                }
            }
            // Remove meta fields
            const { meta, metaTitle, metaKeywords, metaDescription, ...packageWithoutMeta } = pkg;
            return packageWithoutMeta as Package;
        });
        return packages;
    }
    return [];
};

// Fetch featured blogs (build‑time only)
export const fetchFeaturedBlogs = async (): Promise<Blog[]> => {
    const res = await fetch(`${BASE_URL}/blogs?isFeatured=1`, { next: { revalidate: CACHE_REVALIDATE_TIME } });
    const data = await res.json();
    if (Array.isArray(data)) {
        return data.slice(0, 3);
    }
    return [];
};

// Fetch featured places (build‑time only)
export const fetchFeaturedPlaces = async (): Promise<Place[]> => {
    const res = await fetch(`${BASE_URL}/places?isFeatured=1`, { next: { revalidate: CACHE_REVALIDATE_TIME } });
    const data = await res.json();
    if (Array.isArray(data)) {
        return data.slice(0, 6);
    }
    return [];
};

// Fetch featured testimonials (build‑time only)
export const fetchFeaturedTestimonials = async (): Promise<Testimonial[]> => {
    const res = await fetch(`${BASE_URL}/testimonials?isFeatured=1`, { next: { revalidate: CACHE_REVALIDATE_TIME } });
    const data = await res.json();
    if (Array.isArray(data)) {
        return data.slice(0, 6);
    }
    return [];
};

export async function fetchHomeContent(): Promise<HomeContent | null> {
    const res = await fetch(`${BASE_URL}/homecontent`, {
        next: { revalidate: CACHE_REVALIDATE_TIME }
    });
    if (!res.ok) return null;
    return res.json();
}

export async function fetchPackages(page = 1, limit = 10, search = '', status?: number) {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
    });
    if (status !== undefined) {
        params.append('status', String(status));
    }

    const res = await fetch(`${BASE_URL}/packages?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch packages');
    return res.json();
}

// Fetch all packages (build‑time only)
export const fetchAllPackages = async (): Promise<Package[]> => {
    const res = await fetch(`${BASE_URL}/packages`, { next: { revalidate: CACHE_REVALIDATE_TIME } });
    const data = await res.json();
    if (data.success && Array.isArray(data.packages)) {
        const packages = data.packages.map((pkg: any) => {
            if (typeof pkg.tripFacts === 'string') {
                try {
                    pkg.tripFacts = JSON.parse(pkg.tripFacts);
                } catch (e) {
                    console.error('Failed to parse tripFacts for package', pkg.id, e);
                    pkg.tripFacts = {} as Record<string, number>;
                }
            }
            return pkg as Package;
        });
        return packages;
    }
    return [];
};

// Search packages
export const searchPackages = async (query: string): Promise<Package[]> => {
    const res = await fetch(`${BASE_URL}/packages?search=${encodeURIComponent(query)}`, {
        next: { revalidate: CACHE_REVALIDATE_TIME }
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.packages)) {
        return data.packages;
    }
    return [];
};

// Fetch all blogs (build‑time only)
export const fetchAllBlogs = async (): Promise<Blog[]> => {
    const res = await fetch(`${BASE_URL}/blogs`, { next: { revalidate: CACHE_REVALIDATE_TIME } });
    const data = await res.json();
    if (Array.isArray(data)) {
        return data;
    }
    return [];
};

// Fetch all testimonials (build‑time only)
export const fetchAllTestimonials = async (): Promise<Testimonial[]> => {
    const res = await fetch(`${BASE_URL}/testimonials`, { next: { revalidate: CACHE_REVALIDATE_TIME } });
    const data = await res.json();
    if (Array.isArray(data)) {
        return data;
    }
    return [];
};

// Fetch testimonials with pagination (client-side)
export const fetchTestimonials = async (page = 1, limit = 6): Promise<{ data: Testimonial[]; total: number }> => {
    const offset = (page - 1) * limit;
    const res = await fetch(`${BASE_URL}/testimonials?limit=${limit}&offset=${offset}`, { 
        cache: 'no-store' 
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
        return { data: data.data, total: data.total };
    }
    return { data: [], total: 0 };
};

// Fetch single testimonial by slug
export const fetchTestimonialBySlug = async (slug: string): Promise<Testimonial | null> => {
    // Decode slug to ensure handling of special chars if any
    const decodedSlug = decodeURIComponent(slug);
    const url = `${BASE_URL}/testimonial-by-slug/${decodedSlug}`;
    console.log('[API] Fetching testimonial:', url);
    try {
        const res = await fetch(url, {
            cache: 'no-store'
        });
        console.log('[API] Testimonial response status:', res.status);
        
        if (!res.ok) {
            console.error('[API] Failed to fetch testimonial:', await res.text());
            return null;
        }
        return res.json();
    } catch (error) {
        console.error('[API] Error fetching testimonial:', error);
        return null;
    }
};

/** Fetch data by slug (for dynamic pages) */
export const fetchSlugData = async (slug: string): Promise<{ datatype: string; content: any } | null> => {
    const res = await fetch(`${BASE_URL}/resolve-slug/${slug}`, {
        next: { revalidate: CACHE_REVALIDATE_TIME }
    });
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch data');
    }
    return res.json();
};

// Fetch header menu items (build‑time only)
export const fetchHeaderMenu = async (): Promise<MenuItem[]> => {
    const res = await fetch(`${BASE_URL}/menus/type/header`, { next: { revalidate: CACHE_REVALIDATE_TIME } });
    if (!res.ok) {
        throw new Error('Failed to fetch menus');
    }
    return res.json();
};

// Fetch footer menu items (build‑time only)
export const fetchFooterMenu = async (): Promise<MenuItem[]> => {
    const res = await fetch(`${BASE_URL}/menus/type/footer`, { next: { revalidate: CACHE_REVALIDATE_TIME } });
    if (!res.ok) {
        throw new Error('Failed to fetch menus');
    }
    return res.json();
};

// Generic API fetch helper (still dynamic when used directly)
export const fetchGlobalData = async (): Promise<any> => {
    const res = await fetch(`${BASE_URL}/GlobalData`, { next: { revalidate: CACHE_REVALIDATE_TIME } });
    if (!res.ok) {
        throw new Error('Failed to fetch global data');
    }
    return res.json();
};

// Fetch hero section data with static caching (build-time only)
export const fetchHeroSection = async (): Promise<HeroSectionData | null> => {
    try {
        const res = await fetch(`${BASE_URL}/hero`, {
            next: { revalidate: CACHE_REVALIDATE_TIME }
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('Failed to fetch hero section:', error);
        return null;
    }
};

export const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(`${BASE_URL}${path}`, init);
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API request failed: ${res.status} ${res.statusText} - ${errorText}`);
    }
    return res.json();
};

// Fetch all slugs for static generation
export const fetchAllSlugs = async (): Promise<Array<{ slug: string; featured?: number }>> => {
    try {
        const res = await fetch(`${BASE_URL}/all-slugs`, { 
            next: { revalidate: CACHE_REVALIDATE_TIME } 
        });
        if (!res.ok) {
            console.error('Failed to fetch all slugs');
            return [];
        }
        return res.json();
    } catch (error) {
        console.error('Error fetching all slugs:', error);
        return [];
    }
};
