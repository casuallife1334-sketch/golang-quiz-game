/**
 * Resolves image URLs from JSON game data for web display
 * @param {string|null|undefined} imagePath - Image path from JSON
 * @returns {string|null} Resolved URL or null (no image)
 */
export function resolveImageUrl(imagePath) {
  if (!imagePath || imagePath.trim() === '') {
    return null;
  }
  
  const trimmed = imagePath.trim();
  
  // Absolute URLs and browser object/data URLs
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Root-relative public URL
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  
  // Relative paths -> public/images/ prefix (Vite serves public/ at root)
  return `/images/${trimmed}`;
}

// For backward compat - fallback generator
export function getFallbackImage(size = '600x400', seed = 10) {
  return `https://picsum.photos/${size}?random=${seed}`;
}
