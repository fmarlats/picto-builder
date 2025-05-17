/**
 * Utility functions for URL handling
 */

/**
 * Converts a string to a URL-friendly slug
 * @param text The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function createSlug(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with a single hyphen
    .substring(0, 50);        // Limit length to 50 characters
}

/**
 * Extracts the slug from a URL path
 * @param path The URL path
 * @returns The extracted slug or empty string if no slug is found
 */
export function extractSlugFromPath(path: string): string {
  if (!path || path === '/') return '';
  
  // Remove leading slash and anything after a hash or query parameter
  const cleanPath = path.replace(/^\//, '').split(/[#?]/)[0];
  
  // If there's no path segment, return empty string
  if (!cleanPath) return '';
  
  return cleanPath;
}

/**
 * Creates a URL with the slug and hash
 * @param slug The slug to include in the URL
 * @param hash The hash part of the URL (without the # symbol)
 * @returns A complete URL with the slug and hash
 */
export function createUrlWithSlug(slug: string, hash: string): string {
  const baseUrl = window.location.origin;
  const pathWithSlug = slug ? `/${slug}` : '/';
  const hashPart = hash ? `#${hash}` : '';
  
  return `${baseUrl}${pathWithSlug}${hashPart}`;
}
