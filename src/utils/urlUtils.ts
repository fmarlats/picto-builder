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
 * Checks if the summary tab should be shown based on URL query parameter
 * @param url The full URL or just the query string
 * @returns True if the summary parameter is set to 'true', false otherwise
 */
export function shouldShowSummaryTab(url: string): boolean {
  if (!url) return false;

  // Create a URL object to easily parse query parameters
  // If the url doesn't have a protocol, add a dummy one to make URL parsing work
  const fullUrl = url.startsWith('http') ? url : `http://dummy.com${url}`;

  try {
    const urlObj = new URL(fullUrl);
    // Get the 'summary' query parameter
    const summaryParam = urlObj.searchParams.get('summary');
    return summaryParam === 'true';
  } catch (e) {
    console.error('Error parsing URL:', e);
    return false;
  }
}

/**
 * Creates a URL with the build name as a query parameter and hash
 * @param buildName The build name to include as a query parameter
 * @param hash The hash part of the URL (without the # symbol)
 * @param showSummary Whether to show the summary tab when the URL is loaded
 * @returns A complete URL with the build name as a query parameter and hash
 */
export function createUrlWithSlug(buildName: string, hash: string, showSummary: boolean = true): string {
  const baseUrl = window.location.origin;

  // Start with build name parameter if it exists
  let queryParams = buildName ? `?b=${encodeURIComponent(buildName)}` : '?';

  // If there's no build name, start the query string, otherwise add the summary parameter
  if (buildName) {
    queryParams += `&summary=${showSummary ? 'true' : 'false'}`;
  } else {
    queryParams = `?summary=${showSummary ? 'true' : 'false'}`;
  }

  const hashPart = hash ? `#${hash}` : '';

  return `${baseUrl}${queryParams}${hashPart}`;
}
