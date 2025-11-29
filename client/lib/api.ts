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
