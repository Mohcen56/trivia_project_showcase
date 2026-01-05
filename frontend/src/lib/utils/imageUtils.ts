/**
 * Utility functions for handling image URLs
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Converts a potentially relative image URL to an absolute URL
 * @param imageUrl - The image URL from the API (could be relative or absolute)
 * @returns Full absolute URL for the image
 */
export function getFullImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) {
    return null;
  }

  // If it's already an absolute URL, return as-is to avoid breaking signed or cached URLs
  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  // If it's a relative URL (starts with /), prepend the API base URL
  if (imageUrl.startsWith('/')) {
    // Guard against missing base URL
    if (!API_BASE_URL) {
      return imageUrl;
    }
    return `${API_BASE_URL}${imageUrl}`;
  }

  // If it's a relative path without leading slash, add it
  if (!API_BASE_URL) {
    return `/${imageUrl}`;
  }
  return `${API_BASE_URL}/${imageUrl}`;
}