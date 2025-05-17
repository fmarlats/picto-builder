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
 * Extracts the build name from the URL query parameter
 * @param url The full URL or just the query string
 * @returns The extracted build name or empty string if no build name is found
 */
export function extractSlugFromPath(url: string): string {
  if (!url) return '';

  // Create a URL object to easily parse query parameters
  // If the url doesn't have a protocol, add a dummy one to make URL parsing work
  const fullUrl = url.startsWith('http') ? url : `http://dummy.com${url}`;

  try {
    const urlObj = new URL(fullUrl);
    // Get the 'b' query parameter which contains the build name
    return urlObj.searchParams.get('b') || '';
  } catch (e) {
    console.error('Error parsing URL:', e);
    return '';
  }
}

/**
 * Creates a URL with the build name as a query parameter and hash
 * @param buildName The build name to include as a query parameter
 * @param hash The hash part of the URL (without the # symbol)
 * @returns A complete URL with the build name as a query parameter and hash
 */
export function createUrlWithSlug(buildName: string, hash: string): string {
  const baseUrl = window.location.origin;
  const queryParam = buildName ? `?b=${encodeURIComponent(buildName)}` : '';
  const hashPart = hash ? `#${hash}` : '';

  return `${baseUrl}${queryParam}${hashPart}`;
}
