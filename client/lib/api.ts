// Centralized API helpers for the client side
// All calls return the raw JSON data (already filtered on the server side)

const BASE_URL = 'http://localhost:3001/api';

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
}

export interface Blog {
    id: number;
    title: string;
    slug: string;
    abstract: string;
    publishedDate: string;
    featuredImage: string;
    isFeatured: number;
    isBestselling?: number;
    carouselOrder?: number;
}

export interface Testimonial {
    id: number;
    reviewTitle: string;
    fullName: string;
    rating: number;
    description: string; // HTML content
    avatar: string;
    isFeatured: number;
    isBestselling?: number;
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
    description?: string;
    isFeatured: number;
}

// Fetch featured packages (build‑time only)
export const fetchFeaturedPackages = async (): Promise<Package[]> => {
    const res = await fetch(`${BASE_URL}/packages?featured=1`, { cache: 'force-cache' });
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
    const res = await fetch(`${BASE_URL}/packages?isBestselling=1`, { cache: 'force-cache' });
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
            return pkg as Package;
        });
        return packages;
    }
    return [];
};

// Fetch featured blogs (build‑time only)
export const fetchFeaturedBlogs = async (): Promise<Blog[]> => {
    const res = await fetch(`${BASE_URL}/blogs?isFeatured=1`, { cache: 'force-cache' });
    const data = await res.json();
    if (Array.isArray(data)) {
        return data.slice(0, 3);
    }
    return [];
};

// Fetch featured places (build‑time only)
export const fetchFeaturedPlaces = async (): Promise<Place[]> => {
    const res = await fetch(`${BASE_URL}/places?isFeatured=1`, { cache: 'force-cache' });
    const data = await res.json();
    if (Array.isArray(data)) {
        return data.slice(0, 6);
    }
    return [];
};

// Fetch featured testimonials (build‑time only)
export const fetchFeaturedTestimonials = async (): Promise<Testimonial[]> => {
    const res = await fetch(`${BASE_URL}/testimonials?isFeatured=1`, { cache: 'force-cache' });
    const data = await res.json();
    if (Array.isArray(data)) {
        return data.slice(0, 3);
    }
    return [];
};

export async function fetchHomeContent() {
  const res = await fetch(`${BASE_URL}/homecontent`, {
    cache: 'no-store', // Dynamic content
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

// Fetch bestselling testimonials (build‑time only)
export const fetchBestsellingTestimonials = async (): Promise<Testimonial[]> => {
  const res = await fetch(`${BASE_URL}/testimonials?isBestselling=1`, { cache: 'force-cache' });
  const data = await res.json();
    if (Array.isArray(data)) {
        return data.slice(0, 3);
    }
    return [];
};

// Fetch bestselling blogs (build‑time only)
export const fetchBestsellingBlogs = async (): Promise<Blog[]> => {
  const res = await fetch(`${BASE_URL}/blogs?isBestselling=1`, { cache: 'force-cache' });
  const data = await res.json();
    if (Array.isArray(data)) {
        return data.slice(0, 3);
    }
    return [];
};

// Fetch all packages (build‑time only)
export const fetchAllPackages = async (): Promise<Package[]> => {
    const res = await fetch(`${BASE_URL}/packages`, { cache: 'force-cache' });
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
    const res = await fetch(`${BASE_URL}/packages?search=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.packages)) {
        return data.packages;
    }
    return [];
};

// Fetch all blogs (build‑time only)
export const fetchAllBlogs = async (): Promise<Blog[]> => {
    const res = await fetch(`${BASE_URL}/blogs`, { cache: 'force-cache' });
    const data = await res.json();
    if (Array.isArray(data)) {
        return data;
    }
    return [];
};

// Fetch all testimonials (build‑time only)
export const fetchAllTestimonials = async (): Promise<Testimonial[]> => {
    const res = await fetch(`${BASE_URL}/testimonials`, { cache: 'force-cache' });
    const data = await res.json();
    if (Array.isArray(data)) {
        return data;
    }
    return [];
};

/** Fetch data by slug (for dynamic pages) */
export const fetchSlugData = async (slug: string): Promise<{ datatype: string; content: any } | null> => {
    const res = await fetch(`${BASE_URL}/resolve-slug/${slug}`);
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch data');
    }
    return res.json();
};

// Fetch header menu items (build‑time only)
export const fetchHeaderMenu = async (): Promise<MenuItem[]> => {
    const res = await fetch(`${BASE_URL}/menus/type/header`, { cache: 'force-cache' });
    if (!res.ok) {
        throw new Error('Failed to fetch menus');
    }
    return res.json();
};

// Fetch footer menu items (build‑time only)
export const fetchFooterMenu = async (): Promise<MenuItem[]> => {
    const res = await fetch(`${BASE_URL}/menus/type/footer`, { cache: 'force-cache' });
    if (!res.ok) {
        throw new Error('Failed to fetch menus');
    }
    return res.json();
};

// Generic API fetch helper (still dynamic when used directly)
export const fetchGlobalData = async (): Promise<any> => {
    const res = await fetch(`${BASE_URL}/GlobalData`, { cache: 'force-cache' });
    if (!res.ok) {
        throw new Error('Failed to fetch global data');
    }
    return res.json();
};

// Fetch hero section data with static caching (build-time only)
export const fetchHeroSection = async (): Promise<HeroSectionData | null> => {
    try {
        const res = await fetch(`${BASE_URL}/hero`, {
            cache: 'force-cache' // Cache indefinitely, only fetch at build time
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
