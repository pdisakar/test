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
    carouselOrder?: number;
    description?: string;
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
    title: string;
    subtitle: string;
}

/** Fetch featured packages (server already filters by ?featured=1) */
export const fetchFeaturedPackages = async (): Promise<Package[]> => {
    const res = await fetch(`${BASE_URL}/packages?featured=1`);
    const data = await res.json();
    // The endpoint returns { success, packages, ... }
    if (data.success && Array.isArray(data.packages)) {
        return data.packages.slice(0, 6);
    }
    return [];
};

/** Fetch featured blogs */
export const fetchFeaturedBlogs = async (): Promise<Blog[]> => {
    const res = await fetch(`${BASE_URL}/blogs?isFeatured=1`);
    const data = await res.json();
    if (Array.isArray(data)) {
        return data.slice(0, 3);
    }
    return [];
};

/** Fetch featured testimonials */
export const fetchFeaturedTestimonials = async (): Promise<Testimonial[]> => {
    const res = await fetch(`${BASE_URL}/testimonials?isFeatured=1`);
    const data = await res.json();
    if (Array.isArray(data)) {
        return data.slice(0, 3);
    }
    return [];
};

/** Fetch all packages (no filter) */
export const fetchAllPackages = async (): Promise<Package[]> => {
    const res = await fetch(`${BASE_URL}/packages`);
    const data = await res.json();
    if (data.success && Array.isArray(data.packages)) {
        return data.packages;
    }
    return [];
};

/** Fetch all blogs (no filter) */
export const fetchAllBlogs = async (): Promise<Blog[]> => {
    const res = await fetch(`${BASE_URL}/blogs`);
    const data = await res.json();
    if (Array.isArray(data)) {
        return data;
    }
    return [];
};

/** Fetch all testimonials (no filter) */
export const fetchAllTestimonials = async (): Promise<Testimonial[]> => {
    const res = await fetch(`${BASE_URL}/testimonials`);
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

/** Fetch header menu items */
export const fetchHeaderMenu = async (): Promise<MenuItem[]> => {
    const res = await fetch(`${BASE_URL}/menus/type/header`);
    if (!res.ok) {
        throw new Error('Failed to fetch menus');
    }
    return res.json();
};

// Generic API fetch helper
export const fetchGlobalData = async (): Promise<any> => {
    const res = await fetch(`${BASE_URL}/GlobalData`);
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
