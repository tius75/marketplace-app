import createDOMPurify from 'dompurify';

// Client-side sanitizer
let DOMPurify: any;

if (typeof window !== 'undefined') {
  DOMPurify = createDOMPurify(window);
}

/**
 * Sanitize string untuk mencegah XSS
 * @param dirty - String yang akan disanitize
 * @returns Sanitized string
 */
export function sanitizeString(dirty: string | undefined | null): string {
  if (!dirty || typeof dirty !== 'string') return '';
  
  if (DOMPurify) {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: [], // Tidak ada tag HTML yang diizinkan
      ALLOWED_ATTR: []  // Tidak ada attribute yang diizinkan
    });
  }
  
  // Fallback: escape HTML entities
  return dirty
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize HTML tapi tetap izinkan tag aman
 * @param dirty - HTML yang akan disanitize
 * @returns Sanitized HTML
 */
export function sanitizeHTML(dirty: string | undefined | null): string {
  if (!dirty || typeof dirty !== 'string') return '';
  
  if (DOMPurify) {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href']
    });
  }
  
  return dirty;
}

/**
 * Sanitize URL untuk link
 * @param url - URL yang akan disanitize
 * @returns Sanitized URL
 */
export function sanitizeURL(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  
  // Hanya izinkan http, https, dan relative URLs
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
    return url;
  }
  
  return '';
}
