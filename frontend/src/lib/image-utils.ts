/**
 * Get full image URL from relative or absolute path
 * @param imageUrl - Image URL from API (can be relative or absolute)
 * @returns Full image URL
 */
export function getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return '/images/placeholder.png'; // Default placeholder
  }

  const trimmed = imageUrl.trim();

  // If already absolute URL, return as is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Determine file base URL (strip trailing /api if present)
  const rawBase = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-38c7.up.railway.app/api';
  const fileBase = rawBase.replace(/\/api\/?$/, '');

  // Mobile-compatible rules:
  // - paths starting with /data/ or /storage/ or containing 'cache/' -> use filename and map to /uploads/<filename>
  // - paths starting with '/' -> assume server path and prepend fileBase
  // - otherwise assume it's a filename in uploads -> map to /uploads/<filename>

  if (trimmed.startsWith('/data/') || trimmed.startsWith('/storage/') || trimmed.includes('cache/')) {
    const parts = trimmed.split('/');
    const filename = parts[parts.length - 1];
    return `${fileBase}/uploads/${filename}`;
  }

  if (trimmed.startsWith('/')) {
    // server-relative path, e.g. /uploads/abc.jpg
    return `${fileBase}${trimmed}`;
  }

  // Default: assume it's a filename stored in uploads folder
  return `${fileBase}/uploads/${trimmed}`;
}

/**
 * Get multiple image URLs
 */
export function getImageUrls(imageUrls: string[] | null | undefined): string[] {
  if (!imageUrls || imageUrls.length === 0) {
    return [];
  }

  return imageUrls.map(url => getImageUrl(url));
}
