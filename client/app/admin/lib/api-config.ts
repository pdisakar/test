// Admin API configuration
// Use environment variable for production, fallback to localhost for development
export const ADMIN_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const ADMIN_API_BASE = `${ADMIN_API_URL}/api`;

// Helper function to build API URLs
export const getApiUrl = (path: string) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${ADMIN_API_BASE}/${cleanPath}`;
};

// Helper function for image URLs
export const getImageUrl = (path: string) => {
  if (!path) return '';
  return `${ADMIN_API_URL}${path}`;
};
